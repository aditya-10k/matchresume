# Frontend Specification

## Technology

- Next.js
- React
- TypeScript
- Firebase deployment

The frontend can be heavily vibecoded.

The goal is a **beautiful, modern, polished AI product UI**, not a generic admin dashboard.

---

# UI Philosophy

The frontend should feel like a modern AI/developer product.

Prioritize:

- strong visual hierarchy
- clean typography
- generous spacing
- subtle animations
- polished transitions
- responsive layouts
- excellent empty/loading states
- clear feedback during AI operations
- tasteful use of gradients, glass effects, shadows, and borders where appropriate

Avoid making the interface look like a basic Bootstrap/CRUD application.

---

# Leverage the Next.js / React Ecosystem

The coding agent should actively use modern React/Next.js UI solutions rather than implementing every component from scratch.

Where appropriate, leverage:

- Tailwind CSS
- shadcn/ui
- Radix UI
- Lucide icons
- Framer Motion / Motion
- modern code-editor components
- syntax highlighting
- markdown/LaTeX rendering components
- polished drag-and-drop upload components

If a well-maintained library provides a high-quality component, prefer using it over manually implementing the component.

Do not add libraries unnecessarily. Use libraries when they materially improve the UX.

---

# Animations

Use animation intentionally.

Good places for animation:

### Page transitions

Smooth transitions when moving between:

```text
Dashboard
→ Application
→ Analysis
→ Generated Resume
```

### Resume upload

Animate:

```text
Uploading
    ↓
Parsing
    ↓
Embedding
    ↓
Indexed
```

### AI analysis

Show a polished processing state rather than a generic spinner.

Example:

```text
Analyzing job description
       ↓
Finding relevant experience
       ↓
Comparing resumes
       ↓
Building recommendation
```

### Resume generation

Animate the transition from:

```text
Analyzing
    ↓
Generating
    ↓
Validating
    ↓
Complete
```

### Chat

Messages should appear naturally.

Generated LaTeX can have a subtle reveal/update animation.

---

# Animation Principles

Animations should be:

- subtle
- fast
- purposeful
- consistent

Avoid:

- excessive bouncing
- distracting particle effects
- long transitions
- animation on every element
- animations that slow down interaction

The application should feel fast even when AI operations take time.

---

# Main Screens

## 1. Dashboard

Show:

- Resume library
- Recent applications
- Create application button
- Application statistics if useful

Possible layout:

```text id="k3y9k6"
┌──────────────────────────────────────────────────┐
│ Resume Copilot                         + New Job │
├──────────────────────────────────────────────────┤
│                                                  │
│ Your Resumes                                     │
│                                                  │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│ │ AI       │ │ Backend  │ │ General  │          │
│ │ Resume   │ │ Resume   │ │ Resume   │          │
│ └──────────┘ └──────────┘ └──────────┘          │
│                                                  │
│ Recent Applications                              │
│                                                  │
│ UBS — AI Intern                     91%           │
│ Backend Engineer                    78%           │
│ ML Engineer                         86%           │
│                                                  │
└──────────────────────────────────────────────────┘
```

Cards should have subtle hover states and transitions.

---

# 2. Resume Library

Features:

- Upload resume
- List uploaded resumes
- Show resume name
- Show upload/update date
- Delete resume if supported

Use a polished drag-and-drop upload experience.

Upload states should communicate processing clearly:

```text
Uploading
    ↓
Extracting
    ↓
Indexing
    ↓
Ready
```

Upload should call:

```text
POST /resumes
```

---

# 3. New Application

The user can:

- Paste a JD
- Upload a JD PDF
- Toggle Agent Mode
- Start analysis

Example:

```text
┌─────────────────────────────────────────────┐
│ New Application                             │
│                                             │
│ Job Description                             │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Paste the job description...            │ │
│ │                                         │ │
│ │                                         │ │
│ └─────────────────────────────────────────┘ │
│                                             │
│ or                                          │
│                                             │
│        Drop a JD PDF here                   │
│                                             │
│ Agent Mode                    [ ● ON ]      │
│                                             │
│             [ Analyze Position ]            │
└─────────────────────────────────────────────┘
```

The primary action should have a strong visual hierarchy.

---

# 4. Analysis Screen

Display:

```text
Recommended Resume

AI Resume
91% Match

██████████████████░░ 91%

Strong Matches
✓ Python
✓ RAG
✓ LLMs
✓ FastAPI

Gaps
⚠ Azure
⚠ Docker

Why this resume?
...
```

Use visual indicators for match strength.

Retrieved evidence should be expandable rather than overwhelming the user.

---

# 5. Generated Resume Screen

This is one of the most important screens.

Use a professional split-pane interface:

```text
┌──────────────────────────────────────────────────┐
│ Tailored Resume                     [Compile PDF] │
├───────────────────────┬──────────────────────────┤
│                       │                          │
│ LaTeX                 │ Resume Preview           │
│                       │                          │
│ \documentclass...     │  JOHN DOE                │
│ \section...            │                          │
│                       │  Experience              │
│                       │  ...                     │
│                       │                          │
├───────────────────────┴──────────────────────────┤
│ [Copy LaTeX]  [Download .tex]       [PDF]        │
└──────────────────────────────────────────────────┘
```

Use syntax highlighting for LaTeX.

If real-time PDF preview is too expensive for the MVP, show the LaTeX editor and provide a compile/download action.

---

# 6. Application Chat

The chat should feel like an AI workspace rather than a generic chatbot.

Example:

```text
┌─────────────────────────────────────────────┐
│ Resume Copilot                              │
├─────────────────────────────────────────────┤
│                                             │
│ You                                       │
│ Remove the blockchain project.              │
│                                             │
│ Copilot                                     │
│ Done. I replaced it with your RAG project  │
│ because it has stronger relevance to this   │
│ position.                                   │
│                                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Ask for a change...                    │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

Chat should update the generated LaTeX when the resume changes.

---

# 7. Agent Toggle

The toggle should clearly communicate the difference between modes.

```text
Agent Mode
[ ON ]
```

When enabled, optionally show:

```text
JD Analyzer
Resume Researcher
Resume Selector
Resume Writer
Validator
```

during processing.

This can be animated as the workflow progresses.

When disabled, use the simpler RAG pipeline.

---

# AI Processing States

Avoid generic:

```text
Loading...
```

Instead provide meaningful status:

```text
Analyzing job requirements
        ↓
Searching your experience
        ↓
Comparing resume versions
        ↓
Selecting relevant evidence
        ↓
Tailoring resume
        ↓
Validating output
```

These states should be animated and should make the agent workflow visible to the user.

---

# State

Keep state management simple.

Suggested conceptual state:

```text
ResumeState
ApplicationState
ChatState
```

Avoid introducing unnecessary state-management libraries unless the project requires them.

---

# API Client

All backend calls should go through a centralized API client.

Example:

```text
api/
├── resumes.ts
├── applications.ts
└── chat.ts
```

Do not scatter raw HTTP requests throughout UI components.

---

# UX Requirements

Always handle:

- loading
- errors
- empty states
- upload progress where practical
- generation progress
- failed generation
- PDF compilation failures
- network failures

The UI should never appear frozen while the backend is processing.

---

# Responsive Design

The application should work well on:

- desktop
- laptop
- tablet
- mobile where practical

The main resume editor/preview interface can prioritize desktop because it is the primary workflow.

---

# Visual Quality Bar

Before considering the frontend complete, the coding agent should evaluate:

- spacing
- typography
- alignment
- component consistency
- loading states
- hover states
- transitions
- responsive behavior
- accessibility
- error states
- empty states

The result should feel like a polished SaaS/AI application.

Do not settle for the first functional UI generated.

Iterate visually after functionality works.
