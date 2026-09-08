# System Architecture

## High-Level Architecture

```text
                         ┌──────────────────┐
                         │    Next.js       │
                         │    Frontend      │
                         └────────┬─────────┘
                                  │
                                  │ REST API
                                  ▼
                         ┌──────────────────┐
                         │     FastAPI      │
                         │     Backend      │
                         └────────┬─────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
              ▼                   ▼                   ▼
        ┌──────────┐       ┌────────────┐      ┌────────────┐
        │   RAG    │       │   Agents   │      │  Memory    │
        │ Pipeline │       │            │      │            │
        └────┬─────┘       └─────┬──────┘      └─────┬──────┘
             │                   │                    │
             ▼                   ▼                    ▼
        ┌──────────┐        ┌──────────┐        ┌──────────┐
        │ ChromaDB │        │   Groq   │        │PostgreSQL│
        └──────────┘        └──────────┘        └──────────┘
```

# Backend Responsibilities

FastAPI owns:

* resume ingestion
* PDF text extraction
* resume chunking
* embedding generation
* ChromaDB operations
* JD processing
* retrieval
* agent orchestration
* Groq calls
* memory operations
* LaTeX generation
* optional LaTeX compilation
* application persistence

---

# PostgreSQL

PostgreSQL stores structured application data.

Suggested entities:

```text
users
resumes
applications
messages
generated_resumes
preferences
```

Example relationship:

```text
User
 ├── Resumes
 └── Applications
       ├── Messages
       └── Generated Resumes
```

---

# ChromaDB

ChromaDB stores semantic resume knowledge.

Each document should contain:

```json
{
  "document": "resume chunk text",
  "metadata": {
    "user_id": "...",
    "resume_id": "...",
    "section": "projects",
    "project": "Agentic RAG Assistant",
    "source": "ai_resume.pdf"
  }
}
```

Metadata should be used for filtering where useful.

---

# RAG Pipeline

```text
Document
 ↓
Text extraction
 ↓
Section identification
 ↓
Semantic chunking
 ↓
Metadata enrichment
 ↓
Embedding
 ↓
ChromaDB
```

Retrieval:

```text
Query
 ↓
Query embedding
 ↓
Vector search
 ↓
Metadata filtering
 ↓
Deduplication
 ↓
Optional reranking
 ↓
Context
```

---

# Agent Layer

Agents should not directly manipulate databases.

Agents interact with the system through clearly defined tools/functions.

Example:

```text
JD Agent
  ↓
analyze_jd()

Resume Retrieval
  ↓
retrieve_resume_context()

Resume Selector
  ↓
rank_resumes()

Resume Writer
  ↓
generate_latex()

Validator
  ↓
validate_resume()
```

This separation keeps agent logic independent from infrastructure.

---

# LaTeX

LaTeX is the canonical generated format.

The writer agent returns:

```text
valid LaTeX source
```

Optional compilation:

```text
LaTeX
 ↓
LaTeX compiler
 ↓
PDF
```

The compiler should be isolated behind an API/function so it can be replaced later if deployment constraints require it.

---

# Deployment

Frontend:

```text
Next.js
 ↓
Firebase
```

Backend:

```text
FastAPI
 ↓
Vercel
```

Database services:

```text
PostgreSQL → managed PostgreSQL provider
ChromaDB   → persistent deployment/storage
```

Deployment details should not dictate the application architecture during MVP development.
