# Memory Architecture

## Purpose

Memory allows Resume Copilot to remember information across applications and conversations.

Memory must remain separate from the resume knowledge base.

---

# Three Types of Context

## 1. Resume Knowledge

Stored in ChromaDB.

Contains factual career information:

- Projects
- Skills
- Experience
- Education
- Achievements
- Certifications

This is the source of truth for resume facts.

---

## 2. Application Memory

Stored in PostgreSQL.

Contains information about a specific job application:

```text
Application
├── JD
├── JD analysis
├── selected resume
├── generated LaTeX versions
├── current version
└── chat history
```

Application memory allows the user to return later and continue working.

---

## 3. User Memory

Stored in PostgreSQL.

Contains persistent preferences and useful historical information.

Examples:

```text
User prefers one-page resumes.

User prefers concise bullet points.

User prefers project-heavy resumes for AI roles.

User prefers technical skills near the top.

User previously selected AI Resume for an AI internship.
```

Do not store every conversation message as long-term memory.

Only meaningful information should become persistent memory.

---

# Short-Term Context

Short-term context belongs to the current application/conversation.

Example:

```text
Current JD
Current selected resume
Current generated LaTeX
Recent chat messages
Current user instruction
```

This context can be sent directly to the agent.

---

# Long-Term Memory

Long-term memory persists across applications.

Examples:

```text
Resume preferences
Writing preferences
Past resume selections
Relevant application history
```

---

# Memory Retrieval

Before generating a resume, retrieve only memories relevant to the current task.

Example:

```text
Current JD:
AI Engineer

Relevant memories:
- User prefers one-page resumes
- User prefers concise bullets
- User prioritizes projects for AI roles
```

Do not inject unrelated memories into the prompt.

---

# Memory Rules

Memory must never override factual resume evidence.

For example:

```text
Memory:
"User likes mentioning Kubernetes."

Resume knowledge:
No Kubernetes experience exists.
```

The system must NOT add Kubernetes.

Resume knowledge is authoritative for career facts.

---

# Suggested PostgreSQL Tables

```text
user_preferences
----------------
id
user_id
key
value
created_at
updated_at
```

```text
applications
------------
id
user_id
jd_text
jd_analysis
selected_resume_id
created_at
updated_at
```

```text
messages
--------
id
application_id
role
content
created_at
```

```text
generated_resumes
-----------------
id
application_id
latex
version
created_at
```

---

# Memory Principle

Memory should improve personalization.

Memory must never become a source of fabricated resume information.
