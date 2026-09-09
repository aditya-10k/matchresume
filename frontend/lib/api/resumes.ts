import { Resume } from "@/lib/types";
import { API_BASE, getApiHeaders } from "./client";

export async function fetchResumes(): Promise<Resume[]> {
  const res = await fetch(`${API_BASE}/resumes`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch resumes: ${res.statusText}`);
  }
  return res.json();
}

export async function getResume(id: string): Promise<Resume> {
  const res = await fetch(`${API_BASE}/resumes/${id}`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch resume: ${res.statusText}`);
  }
  return res.json();
}

export async function uploadResume(file: File, name?: string): Promise<Resume> {
  const formData = new FormData();
  formData.append("file", file);
  if (name && name.trim()) {
    formData.append("name", name.trim());
  }

  const headers = getApiHeaders();
  delete headers["Content-Type"];

  const res = await fetch(`${API_BASE}/resumes`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorDetail = res.statusText;
    try {
      const errorJson = await res.json();
      if (errorJson.detail) {
        errorDetail = errorJson.detail;
      }
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return res.json();
}

export async function deleteResume(id: string): Promise<void> {
  const res = await fetch(`${API_BASE}/resumes/${id}`, {
    method: "DELETE",
    headers: getApiHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete resume: ${res.statusText}`);
  }
}

export async function checkBackendHealth(): Promise<{ status: string; rag?: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) return { status: "offline" };
    return res.json();
  } catch {
    return { status: "offline" };
  }
}
