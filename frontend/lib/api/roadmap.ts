import { API_BASE, getApiHeaders } from "./client";

export interface RoadmapMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  provider?: string;
  metadata_json?: any;
  created_at: string;
}

export interface RoadmapSessionListItem {
  id: string;
  title: string;
  target_role?: string;
  company?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

export interface RoadmapSession {
  id: string;
  title: string;
  target_role?: string;
  company?: string;
  jd_text: string;
  jd_analysis?: any;
  created_at: string;
  updated_at: string;
  messages: RoadmapMessage[];
}

export async function createRoadmapSession(payload: {
  jd_text: string;
  title?: string;
}): Promise<RoadmapSession> {
  const res = await fetch(`${API_BASE}/api/roadmap/sessions`, {
    method: "POST",
    headers: getApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to create roadmap session");
  }
  return res.json();
}

export async function getRoadmapSessions(): Promise<RoadmapSessionListItem[]> {
  const res = await fetch(`${API_BASE}/api/roadmap/sessions`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function getRoadmapSession(sessionId: string): Promise<RoadmapSession> {
  const res = await fetch(`${API_BASE}/api/roadmap/sessions/${sessionId}`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to load roadmap session");
  }
  return res.json();
}

export async function sendRoadmapMessage(
  sessionId: string,
  message: string
): Promise<RoadmapMessage> {
  const res = await fetch(`${API_BASE}/api/roadmap/sessions/${sessionId}/messages`, {
    method: "POST",
    headers: getApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ message }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send roadmap message");
  }
  return res.json();
}

export async function deleteRoadmapSession(
  sessionId: string
): Promise<{ status: string; id: string }> {
  const res = await fetch(`${API_BASE}/api/roadmap/sessions/${sessionId}`, {
    method: "DELETE",
    headers: getApiHeaders(),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to delete roadmap session");
  }
  return res.json();
}
