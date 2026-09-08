export interface Resume {
  id: string;
  name: string;
  filename: string;
  status: "processing" | "processed" | "failed";
  created_at: string;
  text_preview?: string;
  raw_text?: string;
}

export interface EvidenceChunk {
  content: string;
  resume_id: string;
  section: string;
  similarity: number;
  metadata: Record<string, any>;
}

export interface JDRequirements {
  role?: string;
  required_skills: string[];
  preferred_skills: string[];
  responsibilities: string[];
  keywords: string[];
}

export interface RecommendedResume {
  resume_id: string;
  resume_name: string;
  match_score: number;
  strengths: string[];
  gaps: string[];
  reason: string;
}

export interface ApplicationAnalysis {
  application_id: string;
  requirements: JDRequirements;
  recommendation: RecommendedResume;
  relevant_evidence: EvidenceChunk[];
}

export interface Application {
  id: string;
  company?: string;
  role_title?: string;
  jd_text: string;
  jd_analysis?: any;
  selected_resume_id?: string;
  agent_enabled: boolean;
  match_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface UploadStage {
  id: "uploading" | "extracting" | "indexing" | "ready";
  label: string;
  description: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  has_groq_key: boolean;
  masked_key?: string;
}

export interface UserPreference {
  id: string;
  key: string;
  value: string;
  updated_at: string;
}
