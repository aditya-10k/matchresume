import { Application, ApplicationAnalysis } from "@/lib/types";
import { API_BASE, getApiHeaders } from "./client";

export async function createApplication(data: {
  jd_text: string;
  company?: string;
  role_title?: string;
  agent_enabled: boolean;
}): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: getApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create application");
  }
  return res.json();
}

export async function createApplicationFromPdf(
  file: File,
  company?: string,
  role_title?: string,
  agent_enabled: boolean = true
): Promise<Application> {
  const formData = new FormData();
  formData.append("file", file);
  if (company) formData.append("company", company);
  if (role_title) formData.append("role_title", role_title);
  formData.append("agent_enabled", String(agent_enabled));

  const headers = getApiHeaders();
  delete headers["Content-Type"];

  const res = await fetch(`${API_BASE}/applications/from-pdf`, {
    method: "POST",
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to parse JD PDF");
  }
  return res.json();
}

export async function getApplication(id: string): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Application not found");
  }
  return res.json();
}

export async function listApplications(): Promise<Application[]> {
  const res = await fetch(`${API_BASE}/applications`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch applications");
  }
  return res.json();
}

export async function deleteApplication(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/applications/${id}`, {
    method: "DELETE",
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to delete application");
  }
}

export async function analyzeApplication(id: string): Promise<ApplicationAnalysis> {
  const res = await fetch(`${API_BASE}/applications/${id}/analyze`, {
    method: "POST",
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to analyze application");
  }
  return res.json();
}

export async function tailorApplication(id: string): Promise<{
  application_id: string;
  resume_id: string;
  resume_name: string;
  role_title?: string;
  latex_code: string;
  tailored_summary: string;
  highlighted_skills: string[];
  validation: {
    is_valid: boolean;
    latex_syntax_valid: boolean;
    factual_score: number;
    hallucinations_detected: string[];
    syntax_issues: string[];
    feedback: string;
  };
}> {
  const res = await fetch(`${API_BASE}/applications/${id}/tailor`, {
    method: "POST",
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to tailor resume");
  }
  return res.json();
}

export async function getTailoredResume(id: string): Promise<{
  application_id: string;
  latex_code: string;
  tailored_summary?: string;
  version: number;
  created_at: string;
} | null> {
  const res = await fetch(`${API_BASE}/applications/${id}/tailor`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    return null;
  }
  return res.json();
}

export async function validateCustomLatex(
  id: string,
  latex_code: string
): Promise<{
  is_valid: boolean;
  latex_syntax_valid: boolean;
  factual_score: number;
  hallucinations_detected: string[];
  syntax_issues: string[];
  feedback: string;
}> {
  const res = await fetch(`${API_BASE}/applications/${id}/validate`, {
    method: "POST",
    headers: getApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ latex_code }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to validate LaTeX");
  }
  return res.json();
}
