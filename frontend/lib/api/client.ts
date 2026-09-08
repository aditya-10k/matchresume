export const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("matchresume_token");
}

export function getStoredGroqKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("matchresume_groq_key");
}

export function setStoredToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("matchresume_token", token);
  } else {
    localStorage.removeItem("matchresume_token");
  }
}

export function setStoredGroqKey(key: string | null) {
  if (typeof window === "undefined") return;
  if (key) {
    localStorage.setItem("matchresume_groq_key", key);
  } else {
    localStorage.removeItem("matchresume_groq_key");
  }
}

export function getStoredModel(): string {
  if (typeof window === "undefined") return "qwen/qwen3.6-27b";
  return localStorage.getItem("matchresume_selected_model") || "qwen/qwen3.6-27b";
}

export function getApiHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    ...additionalHeaders,
  };

  const token = getStoredToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const groqKey = getStoredGroqKey();
  if (groqKey) {
    headers["x-groq-api-key"] = groqKey;
  }

  const model = getStoredModel();
  if (model) {
    headers["x-groq-model"] = model;
  }

  return headers;
}
