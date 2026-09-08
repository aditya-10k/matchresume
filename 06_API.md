# API Contract

## Purpose

The FastAPI backend exposes REST APIs consumed by the Next.js frontend.

Keep the API small and straightforward.

---

# Resume APIs

## POST /resumes

Upload a resume PDF.

### Flow

```text
PDF
 ↓
FastAPI
 ↓
Extract text
 ↓
Parse
 ↓
Chunk
 ↓
Embed
 ↓
ChromaDB
 ↓
PostgreSQL metadata
```

### Response

```json
{
  "id": "resume_123",
  "name": "AI Resume",
  "status": "processed"
}
```

---

## GET /resumes

Return the user's resume library.

Example:

```json
[
  {
    "id": "resume_123",
    "name": "AI Resume"
  },
  {
    "id": "resume_456",
    "name": "Backend Resume"
  }
]
```

---

# Application APIs

## POST /applications

Create a new application.

Input:

```json
{
  "jd_text": "...",
  "agent_enabled": true
}
```

The JD may already have been extracted from a PDF by this point.

---

## POST /applications/{id}/analyze

Analyze the JD and determine relevant resume evidence.

Response should contain:

* JD requirements
* recommended resume
* match score
* strengths
* gaps
* relevant evidence

---

## POST /applications/{id}/generate

Generate a tailored resume.

Response:

```json
{
  "latex": "\\documentclass{article}...",
  "version": 1
}
```

---

# Chat API

## POST /applications/{id}/chat

Send a message related to the current application.

Input:

```json
{
  "message": "Remove the backend project and emphasize RAG."
}
```

The agent should use:

* current application context
* chat history
* resume knowledge
* relevant user memory

Response:

```json
{
  "message": "Updated the resume.",
  "latex": "\\documentclass{article}..."
}
```

---

## GET /applications/{id}/messages

Return chat history for an application.

---

# LaTeX API

## POST /latex/compile

Input:

```json
{
  "latex": "\\documentclass{article}..."
}
```

Output:

PDF.

This endpoint is optional for the initial MVP.

---

# Error Handling

APIs should return meaningful errors.

Examples:

```text
400 → Invalid input
404 → Resource not found
422 → Validation error
500 → Internal server error
```

The frontend should display user-friendly messages.

---

# API Design Rules

* Use typed request/response schemas.
* Validate inputs.
* Do not put agent logic directly inside route handlers.
* Route handlers should call backend services.
* Do not expose database credentials or API keys to the frontend.
* Groq calls happen only on the backend.
