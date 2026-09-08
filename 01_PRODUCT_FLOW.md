# Product Flow

## 1. Resume Library

The user can upload multiple resumes.

Example:

* AI Resume
* Backend Resume
* Data Resume
* General Resume

### Upload Flow

```text
User
 ↓
Next.js frontend
 ↓
POST /resumes
 ↓
FastAPI
 ↓
Extract PDF text
 ↓
Parse resume
 ↓
Create semantic chunks
 ↓
Generate embeddings
 ↓
Store chunks + metadata in ChromaDB
 ↓
Store resume metadata in PostgreSQL
```

The original resume should remain immutable.

A tailored resume is a new generated version and must not overwrite the original.

---

# 2. New Application

The user creates an application by providing a job description.

The JD can be:

* pasted as text
* uploaded as a PDF

Flow:

```text
JD
 ↓
JD Analyzer Agent
 ↓
Structured JD Requirements
 ↓
Resume Retrieval
 ↓
Resume Matching
 ↓
Resume Recommendation
 ↓
Tailoring
 ↓
LaTeX
 ↓
Optional PDF compilation
```

---

# 3. Agent Toggle

The frontend provides an agent toggle.

## Agent ON

The system uses the agent orchestration flow.

The agent can:

1. Analyze the JD
2. Determine relevant requirements
3. Decide what resume knowledge to retrieve
4. Search the resume knowledge base
5. Compare candidate evidence
6. Select the strongest resume/content
7. Decide what should be emphasized
8. Generate the tailored LaTeX
9. Validate the generated result

## Agent OFF

Use a simpler deterministic RAG pipeline:

```text
JD
 ↓
JD extraction
 ↓
Embedding / retrieval
 ↓
Relevant resume context
 ↓
LLM tailoring
 ↓
LaTeX
```

The purpose of this toggle is to allow comparison between a straightforward RAG workflow and the agentic workflow.

---

# 4. Resume Recommendation

The system should be able to answer:

> Which of my resumes should I use for this job?

The result should contain:

* recommended resume
* match score
* matching skills
* relevant projects
* relevant experience
* missing/weak requirements
* explanation

Example:

```text
Recommended Resume: AI Resume

Match: 91%

Strong matches:
- Python
- RAG
- LLMs
- FastAPI
- Vector Databases

Weak areas:
- Azure
- Docker

Reason:
The AI resume contains the strongest concentration of
experience relevant to the job description.
```

---

# 5. Tailored Resume

The user can ask the system to tailor the resume.

The system retrieves factual evidence from the user's resume knowledge base.

The generated resume must:

* remain factually accurate
* prioritize relevant experience
* use relevant keywords naturally
* improve bullet wording when appropriate
* preserve the user's actual experience
* output valid LaTeX

The generated resume must never invent:

* projects
* internships
* companies
* technologies
* achievements
* metrics
* responsibilities

---

# 6. Chat

Each application has its own conversation.

Example:

```text
User:
Remove the blockchain project.

Agent:
Done. I replaced it with the RAG project because it is
more relevant to this JD.

User:
Make the RAG bullets more concise.

Agent:
Updated the LaTeX.
```

Chat history is stored in PostgreSQL.

Chat history should be associated with an application.

---

# 7. Application Persistence

An application should preserve:

* JD
* JD analysis
* recommended resume
* retrieved evidence
* generated LaTeX
* generated versions
* chat history
* relevant user preferences

This allows the user to return to an old application later.
