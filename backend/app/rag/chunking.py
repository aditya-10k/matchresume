import re
import uuid
from typing import List, Optional, Dict, Any
from app.schemas.rag import ResumeChunk
from app.rag.interfaces import BaseResumeChunker


SECTION_PATTERNS = {
    "summary": re.compile(r"^(summary|professional summary|profile|objective|about me)", re.IGNORECASE),
    "education": re.compile(r"^(education|academic background|academics|qualifications)", re.IGNORECASE),
    "skills": re.compile(r"^(technical skills|skills|core competencies|technologies|tools & technologies)", re.IGNORECASE),
    "experience": re.compile(r"^(experience|work experience|professional experience|employment history|work history)", re.IGNORECASE),
    "projects": re.compile(r"^(projects|technical projects|key projects|academic projects)", re.IGNORECASE),
    "certifications": re.compile(r"^(certifications|licenses|courses|awards|achievements)", re.IGNORECASE),
}


class ResumeChunker(BaseResumeChunker):
    """
    Section-aware semantic chunker for candidate resumes.
    Splits resumes by real structural headings (Experience, Skills, Education, Projects)
    and produces high-resolution evidence chunks grounded in real candidate text.
    """

    def chunk(self, text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> List[ResumeChunk]:
        if not text or not text.strip():
            return []

        meta = metadata or {}
        lines = [l.strip() for l in text.split("\n") if l.strip()]

        sections: Dict[str, List[str]] = {}
        current_section = "summary"
        sections[current_section] = []

        for line in lines:
            matched_section = None
            clean_line = line.strip(":#* \t-")
            if len(clean_line) < 45:
                for sec_name, pattern in SECTION_PATTERNS.items():
                    if pattern.match(clean_line):
                        matched_section = sec_name
                        break

            if matched_section:
                current_section = matched_section
                if current_section not in sections:
                    sections[current_section] = []
            else:
                sections[current_section].append(line)

        chunks: List[ResumeChunk] = []

        for sec_name, sec_lines in sections.items():
            if not sec_lines:
                continue

            if sec_name in ["experience", "projects"]:
                current_group: List[str] = []
                for line in sec_lines:
                    is_bullet = line.startswith(("-", "•", "*", "–", ">"))
                    if not is_bullet and len(current_group) >= 3:
                        chunk_text = " ".join(current_group).strip()
                        if chunk_text:
                            chunks.append(ResumeChunk(
                                id=str(uuid.uuid4()),
                                content=chunk_text,
                                section=sec_name,
                                metadata={**meta, "resume_id": resume_id, "section": sec_name}
                            ))
                        current_group = [line]
                    else:
                        current_group.append(line)
                if current_group:
                    chunk_text = " ".join(current_group).strip()
                    if chunk_text:
                        chunks.append(ResumeChunk(
                            id=str(uuid.uuid4()),
                            content=chunk_text,
                            section=sec_name,
                            metadata={**meta, "resume_id": resume_id, "section": sec_name}
                        ))

            elif sec_name == "skills":
                for line in sec_lines:
                    if len(line) > 5:
                        chunks.append(ResumeChunk(
                            id=str(uuid.uuid4()),
                            content=line,
                            section=sec_name,
                            metadata={**meta, "resume_id": resume_id, "section": sec_name}
                        ))

            else:
                group_size = 4
                for i in range(0, len(sec_lines), group_size):
                    chunk_text = " ".join(sec_lines[i:i + group_size]).strip()
                    if chunk_text:
                        chunks.append(ResumeChunk(
                            id=str(uuid.uuid4()),
                            content=chunk_text,
                            section=sec_name,
                            metadata={**meta, "resume_id": resume_id, "section": sec_name}
                        ))

        return chunks


def chunk_resume(text: str, resume_id: str, metadata: Optional[Dict[str, Any]] = None) -> List[ResumeChunk]:
    """Helper function to chunk a resume using ResumeChunker."""
    chunker = ResumeChunker()
    return chunker.chunk(text, resume_id, metadata)
