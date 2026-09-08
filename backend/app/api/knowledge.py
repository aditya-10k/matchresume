import re
import logging
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, Resume
from app.api.auth import get_current_user
from app.rag.vector_store import get_vector_store
from app.rag import backfill_existing_resumes

logger = logging.getLogger("knowledge_api")

router = APIRouter(prefix="/knowledge", tags=["Knowledge Graph"])


class KnowledgeNode(BaseModel):
    id: str
    name: str
    category: str = Field(..., description="skills | projects | experience | domains")
    sub_category: Optional[str] = "General"
    level: str = "Proficient"
    weight: int = Field(default=50, description="Relative prominence from 20 to 100 for blob sizing")
    highlight: str = Field(..., description="Executive summary snippet")
    evidence_snippets: List[str] = Field(default_factory=list, description="Verified facts from resume")
    related_nodes: List[str] = Field(default_factory=list, description="Interconnected skills or tools")
    source_resume: str = "Primary Resume"


class KnowledgeUniverseResponse(BaseModel):
    candidate_name: str
    total_nodes: int
    categories: Dict[str, int]
    nodes: List[KnowledgeNode]


def _extract_nodes_from_chunks(chunks: List[Dict[str, Any]], candidate_name: str) -> List[KnowledgeNode]:
    nodes_map: Dict[str, KnowledgeNode] = {}
    skill_names = set()

    for c in chunks:
        content = c.get("content", "").strip()
        sec = c.get("section", "general").lower()
        meta = c.get("metadata", {})
        source = meta.get("name") or meta.get("source") or "Verified Resume"

        if not content:
            continue

        if sec == "skills":
            lines = [l.strip() for l in content.split("\n") if l.strip()]
            for line in lines:
                parts = line.split(":", 1)
                cat_title = parts[0].strip().strip("*#- ")
                items_str = parts[1].strip() if len(parts) > 1 else parts[0]
                
                items = [re.sub(r'[*_]', '', it).strip() for it in re.split(r'[,|•]', items_str) if len(it.strip()) > 1]
                for item in items:
                    clean_name = item.strip()
                    if len(clean_name) < 2 or len(clean_name) > 35:
                        continue
                    
                    node_id = f"skill-{re.sub(r'[^a-zA-Z0-9]', '_', clean_name.lower())}"
                    skill_names.add(clean_name)
                    
                    if node_id not in nodes_map:
                        nodes_map[node_id] = KnowledgeNode(
                            id=node_id,
                            name=clean_name,
                            category="skills",
                            sub_category=cat_title if len(cat_title) < 30 else "Technical Skills",
                            level="Core Skill",
                            weight=55,
                            highlight=f"Specialized in {clean_name} within {cat_title}.",
                            evidence_snippets=[f"{cat_title}: {line}"],
                            related_nodes=[],
                            source_resume=source
                        )

        elif sec == "projects":
            lines = [l.strip() for l in content.split("\n") if l.strip()]
            first_line = lines[0] if lines else ""
            proj_parts = first_line.split("|")
            proj_name = re.sub(r'[*_#]', '', proj_parts[0]).strip()
            tech_stack = proj_parts[1].strip() if len(proj_parts) > 1 else ""

            if len(proj_name) >= 3 and len(proj_name) < 40:
                node_id = f"proj-{re.sub(r'[^a-zA-Z0-9]', '_', proj_name.lower())}"
                evidence = [l for l in lines[1:] if len(l) > 15] or [content]
                tech_items = [re.sub(r'[*_]', '', t).strip() for t in re.split(r'[,|]', tech_stack) if len(t.strip()) > 1]
                
                nodes_map[node_id] = KnowledgeNode(
                    id=node_id,
                    name=proj_name,
                    category="projects",
                    sub_category="System / Application",
                    level="Key Project",
                    weight=85,
                    highlight=f"Built and deployed {proj_name}" + (f" utilizing {tech_stack}" if tech_stack else "."),
                    evidence_snippets=evidence[:4],
                    related_nodes=tech_items[:6],
                    source_resume=source
                )

        elif sec == "experience":
            lines = [l.strip() for l in content.split("\n") if l.strip()]
            first_line = lines[0] if lines else ""
            exp_title = re.sub(r'[*_#]', '', first_line).strip()
            
            if len(exp_title) >= 4 and len(exp_title) < 55:
                node_id = f"exp-{re.sub(r'[^a-zA-Z0-9]', '_', exp_title.lower())[:25]}"
                bullets = [l for l in lines[1:] if len(l) > 20] or [content]
                
                nodes_map[node_id] = KnowledgeNode(
                    id=node_id,
                    name=exp_title,
                    category="experience",
                    sub_category="Work History",
                    level="Professional Role",
                    weight=90,
                    highlight=f"Professional experience at {exp_title}.",
                    evidence_snippets=bullets[:5],
                    related_nodes=[],
                    source_resume=source
                )

    for node in nodes_map.values():
        if node.category == "projects":
            for s in skill_names:
                for ev in node.evidence_snippets:
                    if s.lower() in ev.lower() and s not in node.related_nodes and s != node.name:
                        node.related_nodes.append(s)
            for s in node.related_nodes:
                s_id = f"skill-{re.sub(r'[^a-zA-Z0-9]', '_', s.lower())}"
                if s_id in nodes_map:
                    nodes_map[s_id].weight = min(95, nodes_map[s_id].weight + 12)
                    nodes_map[s_id].level = "High-Impact Core"
                    if node.name not in nodes_map[s_id].related_nodes:
                        nodes_map[s_id].related_nodes.append(node.name)
                    if node.evidence_snippets:
                        nodes_map[s_id].evidence_snippets.append(f"Demonstrated in {node.name}: {node.evidence_snippets[0]}")

    ai_skills = [n.name for n in nodes_map.values() if any(k in n.name.lower() for k in ["lang", "llm", "rag", "agent", "prompt", "torch", "copilot"])]
    if ai_skills:
        nodes_map["domain-ai"] = KnowledgeNode(
            id="domain-ai",
            name="Agentic AI & LLMs",
            category="domains",
            sub_category="Core Discipline",
            level="Primary Domain",
            weight=98,
            highlight="End-to-end design of LLM systems, Agentic workflows, and RAG architectures.",
            evidence_snippets=[f"Verified across {len(ai_skills)} active technical capabilities."],
            related_nodes=ai_skills[:6],
            source_resume="Aggregated Knowledge"
        )

    backend_skills = [n.name for n in nodes_map.values() if any(k in n.name.lower() for k in ["python", "fastapi", "docker", "sql", "postgres", "redis"])]
    if backend_skills:
        nodes_map["domain-backend"] = KnowledgeNode(
            id="domain-backend",
            name="Distributed Systems & Backend",
            category="domains",
            sub_category="Core Discipline",
            level="Architecture",
            weight=92,
            highlight="High-concurrency APIs, microservices, containerization, and data persistence.",
            evidence_snippets=[f"Grounded in production architectures utilizing {', '.join(backend_skills[:4])}."],
            related_nodes=backend_skills[:5],
            source_resume="Aggregated Knowledge"
        )

    return list(nodes_map.values())


@router.get("", response_model=KnowledgeUniverseResponse)
def get_knowledge_universe(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    store = get_vector_store()
    if store.collection.count() == 0:
        backfill_existing_resumes()

    raw_chunks = store.get_user_chunks(user_id=current_user.id)
    if not raw_chunks:
        raw_chunks = store.get_user_chunks()

    candidate_name = getattr(current_user, "name", None) or "Candidate"
    
    if not raw_chunks:
        user_resume = db.query(Resume).filter(Resume.user_id == current_user.id).first()
        if user_resume and user_resume.raw_text:
            backfill_existing_resumes()
            raw_chunks = store.get_user_chunks()
            if user_resume.name:
                candidate_name = user_resume.name

    nodes = _extract_nodes_from_chunks(raw_chunks, candidate_name)
    
    categories_count: Dict[str, int] = {}
    for n in nodes:
        categories_count[n.category] = categories_count.get(n.category, 0) + 1

    return KnowledgeUniverseResponse(
        candidate_name=candidate_name,
        total_nodes=len(nodes),
        categories=categories_count,
        nodes=nodes
    )
