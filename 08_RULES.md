# Development Rules

## Primary Objective

Build the MVP quickly while keeping the core architecture understandable.

Prioritize working functionality over abstraction.

---

## Do Not Overengineer

Do not introduce:

* microservices
* Kubernetes
* event buses
* unnecessary queues
* complex repository patterns
* unnecessary design patterns
* multiple vector databases
* multiple LLM providers
* complex agent frameworks unless required
* unnecessary frontend abstractions

Prefer simple Python functions and small modules.

---

# Frontend

The frontend is Next.js + React + TypeScript.

The frontend is allowed to be heavily vibecoded.

Prioritize:

* clean UI
* working API integration
* loading states
* errors
* resume upload
* JD input
* agent toggle
* match results
* generated LaTeX
* chat history

Do not spend excessive time on visual polish.

---

# Backend

FastAPI should expose clear REST endpoints.

Keep business logic out of route handlers.

Use service functions/modules for:

* RAG
* agents
* memory
* resume processing
* LaTeX generation

---

# RAG

RAG is a core technical component.

Do not hide all retrieval logic behind a framework.

The retrieval pipeline should be understandable and inspectable.

Avoid blindly copying a generic "chat with PDFs" implementation.

---

# Agents

Use agents where reasoning/planning is actually useful.

Do not create an agent for every trivial operation.

Preferred agents:

1. JD Analyzer
2. Resume Selector
3. Resume Writer
4. Optional Validator

Agents should use tools/functions rather than directly manipulating infrastructure.

---

# Memory

Do not mix memory with resume knowledge.

Resume facts:

→ ChromaDB

Application/user state:

→ PostgreSQL

Chat history:

→ PostgreSQL

User preferences:

→ PostgreSQL initially

---

# Resume Integrity

This is a hard requirement.

The system must never fabricate:

* skills
* projects
* companies
* job titles
* achievements
* metrics
* technologies
* responsibilities

Tailoring means changing emphasis and wording, not inventing experience.

---

# LaTeX

Generated resume output must be LaTeX.

Do not introduce Markdown as the canonical resume format.

The UI can display LaTeX source in a code editor/viewer.

Optional PDF generation happens after LaTeX generation.

---

# API Design

Prefer a small number of meaningful endpoints.

Example:

```text
POST /resumes
GET  /resumes

POST /applications
GET  /applications/{id}

POST /applications/{id}/analyze
POST /applications/{id}/generate
POST /applications/{id}/chat

POST /latex/compile
```

The exact API can evolve during implementation.

---

# Development Philosophy

When implementing a feature:

1. Make the simplest version work.
2. Test it.
3. Only then improve it.

Do not spend time building abstractions for hypothetical future requirements.

The goal is a working end-to-end MVP.
