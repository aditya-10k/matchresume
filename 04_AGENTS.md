# Agent Architecture

## Purpose

The agent layer is responsible for reasoning over the user's resume knowledge and job descriptions.

Agents should make decisions about:

- What the JD requires
- What information needs to be retrieved
- Which resume is most relevant
- What information should be emphasized
- How the resume should be tailored
- Whether the generated resume is valid and factually supported

The agents should NOT directly access databases.

They should use tools/functions exposed by the backend.

---

# Agent Mode

The application has an Agent ON/OFF toggle.

## Agent OFF

Use a simple deterministic pipeline:

```text
JD
 ↓
JD parsing
 ↓
Retrieval
 ↓
Relevant resume context
 ↓
LLM generation
 ↓
LaTeX
```

This mode is primarily useful as a baseline.

---

# Agent ON

Use an orchestrated agent workflow:

```text
User
 ↓
JD Analyzer
 ↓
Resume Retrieval
 ↓
Resume Selector
 ↓
Resume Writer
 ↓
Validator
 ↓
LaTeX
```

The orchestration layer decides which agent runs next and what information is passed between agents.

---

# 1. JD Analyzer Agent

### Input

Raw JD text.

### Responsibility

Understand the job description and convert it into structured requirements.

### Output

Structured JSON.

Example:

```json
{
  "role": "AI Engineer Intern",
  "required_skills": ["Python", "RAG", "LLMs"],
  "preferred_skills": ["FastAPI", "Vector Databases"],
  "responsibilities": ["Build AI applications", "Develop backend services"],
  "keywords": ["generative AI", "LLM applications"]
}
```

The output should be deterministic and easy for downstream agents to consume.

---

# 2. Resume Selector Agent

### Input

- JD requirements
- Retrieved resume evidence
- Available resumes

### Responsibility

Determine which resume is the strongest starting point.

It should consider:

- Required skills
- Preferred skills
- Relevant projects
- Relevant experience
- Overall evidence coverage

### Output

```json
{
  "resume_id": "ai_resume",
  "score": 91,
  "strengths": ["RAG", "Python", "LLMs"],
  "gaps": ["Azure"],
  "reason": "..."
}
```

The score is an internal heuristic, not a claim of objective hiring probability.

---

# 3. Resume Writer Agent

### Input

- JD
- JD requirements
- Selected resume
- Retrieved evidence
- Relevant user preferences

### Responsibility

Generate a tailored resume.

The output must be valid LaTeX.

The writer should:

- Prioritize relevant experience
- Rewrite bullets when useful
- Adjust skill ordering
- Select relevant projects
- Remove irrelevant content where appropriate
- Preserve factual accuracy

The writer must NOT invent information.

---

# 4. Validator Agent

The validator checks the generated resume before it is returned.

It should check:

### Factual validity

Are generated claims supported by retrieved resume evidence?

### JD alignment

Does the resume address important JD requirements?

### LaTeX validity

Does the generated output appear to be valid LaTeX?

### Hallucination

Did the writer introduce unsupported:

- technologies
- companies
- projects
- metrics
- responsibilities
- achievements

### Output

```json
{
  "valid": true,
  "issues": [],
  "unsupported_claims": [],
  "jd_coverage": 0.89
}
```

If validation fails, the orchestrator can ask the writer to regenerate with the validator feedback.

---

# Agent Tools

Agents should interact with the backend through tools such as:

```text
analyze_jd()
retrieve_resume_context()
search_resume()
get_resume()
rank_resumes()
get_user_preferences()
get_application_history()
save_generated_resume()
validate_latex()
```

The exact implementation can change.

The conceptual separation should remain.

---

# Agent Orchestration

A simple orchestration flow is sufficient.

```text
JD Analyzer
    ↓
Requirement extraction
    ↓
Retrieve evidence
    ↓
Resume Selector
    ↓
Resume Writer
    ↓
Validator
    ↓
    ├── PASS → return LaTeX
    │
    └── FAIL → Writer retry
```

Do not create unnecessary autonomous agents.

The goal is controlled agentic behavior, not maximum agent count.
