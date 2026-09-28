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

export function getStoredOpenRouterKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("matchresume_openrouter_key");
}

export function setStoredOpenRouterKey(key: string | null) {
  if (typeof window === "undefined") return;
  if (key) {
    localStorage.setItem("matchresume_openrouter_key", key);
  } else {
    localStorage.removeItem("matchresume_openrouter_key");
  }
}

import { DEFAULT_MODEL_ID } from "@/lib/model-themes";

const DEPRECATED_MODELS = new Set([
  "qwen/qwen3.6-27b",
  "meta-llama/llama-prompt-guard-2-22m",
  "llama-3.1-8b-instant",
]);

export function getStoredModel(): string {
  if (typeof window === "undefined") return DEFAULT_MODEL_ID;
  const saved = localStorage.getItem("matchresume_selected_model");
  if (!saved || DEPRECATED_MODELS.has(saved)) {
    localStorage.setItem("matchresume_selected_model", DEFAULT_MODEL_ID);
    return DEFAULT_MODEL_ID;
  }
  return saved;
}

export function getApiHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
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

  const openRouterKey = getStoredOpenRouterKey();
  if (openRouterKey) {
    headers["x-openrouter-api-key"] = openRouterKey;
  }

  const model = getStoredModel();
  if (model) {
    headers["x-groq-model"] = model;
  }

  return headers;
}
