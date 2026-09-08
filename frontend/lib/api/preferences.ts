import { API_BASE, getApiHeaders } from "./client";
import { UserPreference } from "@/lib/types";

export async function getPreferences(): Promise<UserPreference[]> {
  const res = await fetch(`${API_BASE}/preferences`, {
    headers: getApiHeaders(),
    cache: "no-store",
  });
  if (!res.ok) {
    return [];
  }
  return res.json();
}

export async function savePreference(key: string, value: string): Promise<UserPreference> {
  const res = await fetch(`${API_BASE}/preferences`, {
    method: "POST",
    headers: getApiHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ key, value }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Failed to save preference");
  }
  return res.json();
}

export async function deletePreference(key: string): Promise<void> {
  const res = await fetch(`${API_BASE}/preferences/${key}`, {
    method: "DELETE",
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    throw new Error("Failed to delete preference");
  }
}
