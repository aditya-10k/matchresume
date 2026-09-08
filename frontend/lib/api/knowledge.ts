import { API_BASE, getApiHeaders } from "./client";

export interface KnowledgeNode {
  id: string;
  name: string;
  category: "skills" | "projects" | "experience" | "domains";
  sub_category?: string;
  level: string;
  weight: number;
  highlight: string;
  evidence_snippets: string[];
  related_nodes: string[];
  source_resume: string;
}

export interface KnowledgeUniverseResponse {
  candidate_name: string;
  total_nodes: number;
  categories: Record<string, number>;
  nodes: KnowledgeNode[];
}

export async function getKnowledgeUniverse(): Promise<KnowledgeUniverseResponse> {
  const res = await fetch(`${API_BASE}/api/knowledge`, {
    headers: getApiHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load knowledge graph: ${res.statusText}`);
  }
  return res.json();
}
