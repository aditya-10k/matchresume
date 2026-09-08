import { Application, ApplicationAnalysis } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function createApplication(data: {
  jd_text: string;
  company?: string;
  role_title?: string;
  agent_enabled: boolean;
}): Promise<Application> {
  const res = await fetch(`${API_BASE}/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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

  const res = await fetch(`${API_BASE}/applications/from-pdf`, {
    method: "POST",
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
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Application not found");
  }
  return res.json();
}

export async function listApplications(): Promise<Application[]> {
  const res = await fetch(`${API_BASE}/applications`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch applications");
  }
  return res.json();
}

export async function analyzeApplication(id: string): Promise<ApplicationAnalysis> {
  const res = await fetch(`${API_BASE}/applications/${id}/analyze`, {
    method: "POST",
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to analyze application");
  }
  return res.json();
}
