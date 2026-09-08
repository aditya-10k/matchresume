import { API_BASE, getApiHeaders } from "./client";
import { Message } from "@/lib/types";

export interface ChatResponse {
  message: string;
  latex: string;
  modifications_made: string[];
}

export async function getChatMessages(applicationId: string): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/messages`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function sendChatMessage(
  applicationId: string,
  message: string
): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/applications/${applicationId}/chat`, {
    method: "POST",
    headers: getApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to send message to refinement assistant");
  }
  return res.json();
}
