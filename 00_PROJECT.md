# Resume Copilot — Project Context

## What We Are Building

Resume Copilot is a personal AI resume intelligence system.

The system stores multiple versions of the user's resumes, converts their content into a searchable knowledge base using RAG, analyzes job descriptions, determines which resume/content is most relevant, and generates a tailored resume in LaTeX.

The system also maintains user/application history and preferences.

## Core Objective

Build a working MVP quickly.

The project should demonstrate:

* RAG
* Vector databases
* LLM-powered agents
* Agent orchestration
* Long-term application/user memory
* JD-to-resume matching
* Controlled resume generation
* LaTeX generation
* Conversational resume refinement

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* BLoC-style state management is NOT required
* Keep frontend architecture simple
* UI can be generated/vibecoded
* Frontend will be deployed through Firebase

### Backend

* Python
* FastAPI
* REST APIs
* Backend deployed through Vercel initially

### LLM

* Groq API
* Agents use Groq as the LLM provider
* Keep the LLM integration abstract enough that the provider can be changed later

### Databases

PostgreSQL:

* Users
* Resume metadata
* Applications
* Generated resume versions
* Chat history
* User preferences

ChromaDB:

* Resume embeddings
* Resume chunks
* Semantic retrieval
* Resume knowledge

## Important Architectural Principle

PostgreSQL and ChromaDB serve different purposes.

PostgreSQL is the application's source of truth for structured data.

ChromaDB is the semantic knowledge/retrieval layer.

Do not use ChromaDB as the primary relational application database.

## Output Format

The canonical generated resume format is LaTeX.

The system should generate valid LaTeX code.

PDF generation is an optional secondary step:

LaTeX → PDF

The system should never require PDF as the canonical resume representation.

## MVP Scope

The MVP must support:

1. Upload multiple resumes
2. Parse resume PDFs
3. Store resume knowledge in ChromaDB
4. Add a JD as text or PDF
5. Analyze the JD
6. Retrieve relevant resume evidence
7. Recommend the most suitable resume
8. Tailor the resume
9. Generate LaTeX
10. Optionally compile LaTeX into PDF
11. Maintain application chat history
12. Store user/application preferences
13. Toggle agentic mode from the frontend

## What NOT To Build

Do not add unnecessary complexity.

Avoid:

* Microservices
* Kubernetes
* Complex authentication systems
* Complex frontend state architecture
* Multiple vector databases
* Multiple LLM providers
* Fine-tuning
* Model training
* Complex memory frameworks
* Elaborate UI animations
* Production-scale infrastructure

The goal is a technically meaningful, working MVP.
