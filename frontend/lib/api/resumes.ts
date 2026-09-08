import { Resume } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export async function fetchResumes(): Promise<Resume[]> {
  const res = await fetch(`${API_BASE}/resumes`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch resumes: ${res.statusText}`);
  }
  return res.json();
}

export async function getResume(id: string): Promise<Resume> {
  const res = await fetch(`${API_BASE}/resumes/${id}`, {
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

  const res = await fetch(`${API_BASE}/resumes`, {
    method: "POST",
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
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Failed to delete resume: ${res.statusText}`);
  }
}

export async function checkBackendHealth(): Promise<{ status: string; mock_rag: boolean }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: "no-store" });
    if (!res.ok) return { status: "offline", mock_rag: false };
    return res.json();
  } catch {
    return { status: "offline", mock_rag: false };
  }
}
