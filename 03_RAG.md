# RAG Design

## Purpose

The RAG system is the core knowledge layer of Resume Copilot.

It represents the user's career history as a searchable knowledge base.

The system should retrieve factual evidence rather than relying on the LLM's memory.

---

# Knowledge Model

Resume information should be represented as meaningful chunks.

Do not treat an entire resume as one document.

Example:

```text
Resume
├── Summary
├── Skills
├── Education
├── Experience
│   ├── Company A
│   └── Company B
└── Projects
    ├── Project A
    ├── Project B
    └── Project C
```

Each meaningful section/project/experience item should become one or more retrievable documents.

---

# Metadata

Every chunk should have metadata where available.

Example:

```json
{
  "user_id": "user123",
  "resume_id": "resume456",
  "section": "project",
  "project": "Agentic RAG Assistant",
  "skills": ["Python", "RAG", "LangGraph", "ChromaDB"],
  "source": "ai_resume.pdf"
}
```

Metadata is important because retrieval should not rely exclusively on semantic similarity.

---

# Retrieval

The initial retrieval strategy should combine:

1. semantic similarity
2. metadata filtering
3. deduplication
4. optional reranking

Example:

```text
JD requirement:
"Experience building RAG applications with vector databases"

Semantic retrieval:
→ Agentic RAG project

Metadata retrieval:
→ chunks tagged RAG
→ chunks tagged ChromaDB
→ chunks tagged vector databases

Combined evidence:
→ strongest relevant context
```

---

# Retrieval API

The core retrieval function should have a simple interface:

```python
retrieve_context(
    query: str,
    resume_id: str | None = None,
    section: str | None = None,
    top_k: int = 8
)
```

It should return structured evidence.

Example:

```json
[
  {
    "content": "...",
    "resume_id": "...",
    "section": "project",
    "similarity": 0.89,
    "metadata": {}
  }
]
```

---

# JD Retrieval

The JD should first be transformed into structured requirements.

Example:

```json
{
  "skills": ["Python", "RAG", "FastAPI"],
  "concepts": ["LLMs", "Agentic AI"]
}
```

Each requirement can then be used to retrieve evidence independently.

This is preferable to embedding the entire JD as one query.

---

# Evidence-Based Generation

The writer agent should receive retrieved evidence.

Conceptually:

```text
JD
+
JD Requirements
+
Retrieved Resume Evidence
+
User Preferences
 ↓
Writer Agent
 ↓
LaTeX
```

The writer must not invent unsupported facts.

---

# RAG Evaluation

For development, retrieval should be inspectable.

The application should be able to show:

```text
Query
 ↓
Retrieved chunks
 ↓
Similarity scores
 ↓
Source resume
 ↓
Generated output
```

This makes debugging and demonstrating the RAG pipeline easier.

---

# Important Rule

The vector database contains factual career information.

The LLM decides how to use that information.

The LLM must not become the source of truth for the user's career history.
