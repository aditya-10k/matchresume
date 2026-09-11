import { API_BASE, getApiHeaders } from "./client";
import { UserProfile } from "@/lib/types";

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  name: string;
  has_groq_key: boolean;
}

export async function registerUser(data: {
  email: string;
  password: string;
  name?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Registration failed");
  }
  return res.json();
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Invalid email or password");
  }
  return res.json();
}

export async function getMe(): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Unauthorized");
  }
  return res.json();
}

export async function saveGroqKey(groq_api_key: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/key`, {
    method: "POST",
    headers: getApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ groq_api_key }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save Groq key");
  }
  return res.json();
}

export async function deleteGroqKey(): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/key`, {
    method: "DELETE",
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to delete Groq key");
  }
}

export async function validateGroqKey(groq_api_key: string): Promise<{
  valid: boolean;
  message: string;
  models?: string[];
}> {
  const res = await fetch(`${API_BASE}/auth/validate-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ groq_api_key }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Failed to validate key");
  }
  return data;
}

export async function validateOpenRouterKey(openrouter_api_key: string): Promise<{
  valid: boolean;
  message: string;
}> {
  const res = await fetch(`${API_BASE}/auth/validate-openrouter-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ openrouter_api_key }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.detail || "Failed to validate OpenRouter key");
  }
  return {
    valid: data.is_valid,
    message: data.message,
  };
}

