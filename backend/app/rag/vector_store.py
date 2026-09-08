import os
import logging
from typing import List, Optional, Dict, Any
import chromadb
from app.schemas.rag import ResumeChunk
from app.rag.interfaces import BaseVectorStore
from app.config import settings

logger = logging.getLogger("vector_store")


class ChromaStore(BaseVectorStore):
    """
    Persistent ChromaDB vector database manager for candidate resumes.
    Stores semantic embeddings, section metadata, and raw text chunks.
    Configured with cosine distance metric for accurate semantic similarity.
    """

    _instance = None

    def __init__(self, collection_name: str = "resume_knowledge"):
        self.collection_name = collection_name
        self.persist_dir = os.path.abspath(settings.CHROMA_PERSIST_DIR)
        os.makedirs(self.persist_dir, exist_ok=True)
        
        logger.info(f"Connecting to persistent ChromaDB at {self.persist_dir}...")
        self.client = chromadb.PersistentClient(path=self.persist_dir)
        self.collection = self.client.get_or_create_collection(
            name=self.collection_name,
            metadata={"hnsw:space": "cosine"}
        )
        logger.info(f"ChromaDB collection '{self.collection_name}' ready. Current items: {self.collection.count()}")

    def add_chunks(self, chunks: List[ResumeChunk], embeddings: List[List[float]]) -> None:
        """Stores or upserts chunks, vector embeddings, and sanitized metadata into collection."""
        if not chunks or not embeddings:
            return

        ids = [c.id for c in chunks]
        documents = [c.content for c in chunks]

        # Sanitize metadata for ChromaDB (primitive scalar values only)
        metadatas = []
        for c in chunks:
            c_meta = c.metadata or {}
            sanitized = {
                "resume_id": str(c_meta.get("resume_id", "")),
                "section": str(c.section or "general"),
                "user_id": str(c_meta.get("user_id", "")),
                "source": str(c_meta.get("source", "")),
                "name": str(c_meta.get("name", "")),
            }
            metadatas.append(sanitized)

        self.collection.upsert(
            ids=ids,
            embeddings=embeddings,
            documents=documents,
            metadatas=metadatas
        )
        logger.info(f"Indexed {len(chunks)} chunks into ChromaDB collection '{self.collection_name}'. Total: {self.collection.count()}")

    def query(
        self,
        query_embedding: List[float],
        top_k: int = 8,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Queries vector collection using dense vector embedding with optional metadata filtering."""
        total_items = self.collection.count()
        if total_items == 0:
            return []

        # Construct ChromaDB where clause
        where_clause = None
        if filters:
            clean_filters = {k: str(v) for k, v in filters.items() if v is not None and str(v).strip()}
            if len(clean_filters) == 1:
                k, v = next(iter(clean_filters.items()))
                where_clause = {k: v}
            elif len(clean_filters) > 1:
                where_clause = {"$and": [{k: v} for k, v in clean_filters.items()]}

        limit = min(top_k, total_items)
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                where=where_clause,
                include=["documents", "metadatas", "distances"]
            )
        except Exception as e:
            logger.error(f"ChromaDB query failed: {e}")
            return []

        output = []
        if results and results["ids"] and len(results["ids"][0]) > 0:
            doc_ids = results["ids"][0]
            docs = results["documents"][0] if results.get("documents") else [""] * len(doc_ids)
            metas = results["metadatas"][0] if results.get("metadatas") else [{}] * len(doc_ids)
            distances = results["distances"][0] if results.get("distances") else [0.5] * len(doc_ids)

            for cid, doc, meta, dist in zip(doc_ids, docs, metas, distances):
                # Cosine similarity in Chroma is roughly 1.0 - distance
                sim = max(0.0, min(1.0, 1.0 - float(dist)))
                output.append({
                    "id": cid,
                    "content": doc,
                    "metadata": meta,
                    "section": meta.get("section", "general"),
                    "resume_id": meta.get("resume_id", ""),
                    "similarity": round(sim, 3)
                })

        return output

    def get_user_chunks(
        self,
        user_id: Optional[str] = None,
        resume_id: Optional[str] = None,
        allow_all: bool = False
    ) -> List[Dict[str, Any]]:
        """Retrieves indexed chunks for a candidate or resume to construct the Knowledge Graph."""
        if not user_id and not resume_id and not allow_all:
            # Multi-tenant guard: refuse un-scoped dump across all users unless explicitly permitted
            return []

        where_clause = None
        filters = {}
        if user_id:
            filters["user_id"] = str(user_id)
        if resume_id:
            filters["resume_id"] = str(resume_id)

        if len(filters) == 1:
            k, v = next(iter(filters.items()))
            where_clause = {k: v}
        elif len(filters) > 1:
            where_clause = {"$and": [{k: v} for k, v in filters.items()]}

        try:
            data = self.collection.get(
                where=where_clause,
                include=["documents", "metadatas"]
            )
        except Exception as e:
            logger.error(f"Failed to fetch chunks from ChromaDB: {e}")
            return []

        output = []
        if data and data.get("ids"):
            for cid, doc, meta in zip(data["ids"], data["documents"], data["metadatas"]):
                output.append({
                    "id": cid,
                    "content": doc,
                    "metadata": meta,
                    "section": meta.get("section", "general"),
                    "resume_id": meta.get("resume_id", ""),
                    "user_id": meta.get("user_id", "")
                })
        return output

    def delete_resume(self, resume_id: str) -> None:
        """Removes all indexed chunks associated with a deleted resume."""
        try:
            self.collection.delete(where={"resume_id": str(resume_id)})
            logger.info(f"Deleted chunks for resume {resume_id} from ChromaDB.")
        except Exception as e:
            logger.warning(f"Failed to delete chunks for resume {resume_id}: {e}")


def get_vector_store() -> ChromaStore:
    """Singleton factory for ChromaStore."""
    if ChromaStore._instance is None:
        ChromaStore._instance = ChromaStore()
    return ChromaStore._instance
