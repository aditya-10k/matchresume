import { API_BASE, getApiHeaders } from "./client";

export interface GuardrailResult {
  is_valid: boolean;
  category: string;
  reason: string;
}

export interface QueryClassification {
  intent: "PROFILE_QUERY" | "JOB_DESCRIPTION";
  confidence: number;
  summary: string;
  key_topics: string[];
}

export interface CareerEvidenceSnippet {
  content: string;
  section: string;
  similarity: number;
  source_resume: string;
}

export interface CareerQueryAnswer {
  query: string;
  answer: string;
  evidence: CareerEvidenceSnippet[];
  suggested_followups: string[];
  model_used: string;
  total_evidence_chunks: number;
}

export interface StudioDispatchResponse {
  status: "success" | "rejected";
  intent: "PROFILE_QUERY" | "JOB_DESCRIPTION" | "REJECTED";
  guardrail: GuardrailResult;
  classification?: QueryClassification;
  profile_answer?: CareerQueryAnswer;
}

function parseErrorMessage(errorData: any, fallback: string): string {
  if (!errorData) return fallback;
  if (typeof errorData.detail === "string") return errorData.detail;
  if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
    return errorData.detail
      .map((d: any) => d.msg || (typeof d === "string" ? d : JSON.stringify(d)))
      .join("; ");
  }
  if (errorData.detail && typeof errorData.detail === "object") {
    return JSON.stringify(errorData.detail);
  }
  if (typeof errorData.message === "string") return errorData.message;
  return fallback;
}

export async function dispatchStudioPrompt(prompt: string): Promise<StudioDispatchResponse> {
  const headers = getApiHeaders({ "Content-Type": "application/json" });
  const res = await fetch(`${API_BASE}/api/career/dispatch`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prompt }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(errorData, "Failed to dispatch prompt through pipeline."));
  }

  return res.json();
}

export async function queryCareerProfile(query: string): Promise<CareerQueryAnswer> {
  const headers = getApiHeaders({ "Content-Type": "application/json" });
  const res = await fetch(`${API_BASE}/api/career/query`, {
    method: "POST",
    headers,
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(parseErrorMessage(errorData, "Failed to query career profile."));
  }

  return res.json();
}
