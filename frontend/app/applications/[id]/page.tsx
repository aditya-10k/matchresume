"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Briefcase,
  ChevronDown,
  Layers,
  Bot,
  RefreshCw,
  Code2
} from "lucide-react";
import { useModel } from "@/context/ModelContext";
import { getApplication, analyzeApplication } from "@/lib/api/applications";
import { Application, ApplicationAnalysis, EvidenceChunk } from "@/lib/types";
import MatchGauge from "@/components/applications/MatchGauge";

export default function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const applicationId = resolvedParams.id;
  const { selectedModel } = useModel();

  const [application, setApplication] = useState<Application | null>(null);
  const [analysis, setAnalysis] = useState<ApplicationAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showEvidence, setShowEvidence] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const app = await getApplication(applicationId);
      setApplication(app);

      // Fetch or re-run analysis
      const analysisData = await analyzeApplication(applicationId);
      setAnalysis(analysisData);
    } catch (err: any) {
      setError(err.message || "Failed to load application data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-8">
        <div
          className="h-12 w-12 rounded-full border-2 border-t-transparent animate-spin mb-4"
          style={{ borderColor: `${selectedModel.colors.primary} transparent transparent transparent` }}
        />
        <h3 className="text-sm font-semibold text-white">Loading Position Fit Analysis...</h3>
        <p className="text-xs text-zinc-400 mt-1">Evaluating candidate resumes against requirements.</p>
      </div>
    );
  }

  if (error || !application || !analysis) {
    return (
      <div className="mx-auto max-w-xl p-8 text-center">
        <div className="rounded-3xl border border-rose-500/20 bg-rose-950/20 p-8">
          <AlertTriangle className="h-8 w-8 text-rose-400 mx-auto" />
          <h3 className="mt-3 text-sm font-semibold text-rose-200">Analysis Unavailable</h3>
          <p className="mt-1 text-xs text-rose-300/80">{error || "Could not retrieve application."}</p>
          <button
            onClick={loadData}
            className="mt-4 rounded-full border border-rose-500/30 bg-rose-950/40 px-5 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/20 transition-all"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { recommendation, requirements, relevant_evidence } = analysis;

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Dynamic Background Glow */}
      <div
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full blur-[140px] -z-10 transition-colors duration-700"
        style={{
          backgroundColor: selectedModel.colors.primary,
          opacity: 0.16,
        }}
      />

      {/* Top Header Card */}
      <div
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl border bg-white/80 dark:bg-black/50 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl transition-all"
        style={{ borderColor: `${selectedModel.colors.primary}25` }}
      >
        <div>
          <div className="flex items-center gap-2">
            <span
              className="rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{
                background: `${selectedModel.colors.primary}18`,
                color: selectedModel.colors.primary,
                border: `1px solid ${selectedModel.colors.primary}30`,
              }}
            >
              {application.agent_enabled ? "Agentic Workflow" : "Deterministic Baseline"}
            </span>
            {application.company && (
              <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">@ {application.company}</span>
            )}
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            {application.role_title || requirements.role || "Target Position Analysis"}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/applications/${applicationId}/tailor`}
            className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold text-white shadow-xl hover:brightness-110 active:scale-95 transition-all"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
              boxShadow: `0 8px 25px ${selectedModel.colors.primary}40`,
            }}
          >
            <Sparkles className="h-4 w-4" />
            <span>Tailor LaTeX Resume</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Primary Recommendation Banner with Radial Match Gauge */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Radial Score Card */}
        <div
          className="rounded-3xl border bg-white/80 dark:bg-black/40 p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl flex flex-col items-center justify-center text-center"
          style={{ borderColor: `${selectedModel.colors.primary}25` }}
        >
          <MatchGauge score={recommendation.match_score} size={170} />

          <div className="mt-5 text-center">
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">Recommended Resume Starting Point:</span>
            <h3 className="mt-1 text-base font-bold text-zinc-900 dark:text-white tracking-tight">
              {recommendation.resume_name}
            </h3>
          </div>
        </div>

        {/* Right Column: Rationale & Strengths / Gaps */}
        <div
          className="lg:col-span-2 rounded-3xl border bg-white/80 dark:bg-black/40 p-6 shadow-xl dark:shadow-2xl backdrop-blur-xl flex flex-col justify-between"
          style={{ borderColor: `${selectedModel.colors.primary}25` }}
        >
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 pb-2">
              Aira Recommendation Rationale
            </h3>
            <p className="mt-3 text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed">
              {recommendation.reason}
            </p>

            {/* Strengths Grid */}
            <div className="mt-5">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-2">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Verified Matching Strengths ({recommendation.strengths.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {recommendation.strengths.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 dark:bg-emerald-950/25 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 shadow-sm"
                  >
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Gaps Grid */}
            {recommendation.gaps.length > 0 && (
              <div className="mt-4">
                <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  Missing or Weak Areas ({recommendation.gaps.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {recommendation.gaps.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 dark:bg-amber-950/25 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 shadow-sm"
                    >
                      <AlertTriangle className="h-3 w-3 text-amber-500 dark:text-amber-400" />
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-[10px] text-zinc-500 border-t border-zinc-200 dark:border-white/10 pt-2">
            Factual Guard: The system will never fabricate experience for missing skills. Tailoring will optimize keyword emphasis and bullet phrasing around verified evidence.
          </p>
        </div>
      </div>

      {/* JD Requirements Breakdown */}
      <div
        className="mt-6 rounded-3xl border bg-white/80 dark:bg-black/35 p-6 shadow-lg dark:shadow-xl backdrop-blur-xl"
        style={{ borderColor: `${selectedModel.colors.primary}20` }}
      >
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 pb-2">
          Structured Job Requirements
        </h3>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-white mb-2">Mandatory Technical Requirements</h4>
            <div className="flex flex-wrap gap-1.5">
              {requirements.required_skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 px-3 py-1 text-xs text-zinc-800 dark:text-zinc-200"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-white mb-2">Nice-To-Have Competencies</h4>
            <div className="flex flex-wrap gap-1.5">
              {requirements.preferred_skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 px-3 py-1 text-xs text-zinc-600 dark:text-zinc-400"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {requirements.responsibilities.length > 0 && (
          <div className="mt-5 border-t border-zinc-200 dark:border-white/10 pt-4">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-white mb-2">Key Role Responsibilities</h4>
            <ul className="space-y-1 text-xs text-zinc-700 dark:text-zinc-300 list-disc list-inside">
              {requirements.responsibilities.map((resp, i) => (
                <li key={i}>{resp}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Expandable RAG Retrieved Evidence Accordion */}
      <div
        className="mt-6 rounded-3xl border bg-white/80 dark:bg-black/35 p-6 shadow-lg dark:shadow-xl backdrop-blur-xl"
        style={{ borderColor: `${selectedModel.colors.primary}20` }}
      >
        <button
          type="button"
          onClick={() => setShowEvidence((prev) => !prev)}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4" style={{ color: selectedModel.colors.primary }} />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-300">
              Retrieved RAG Evidence Chunks ({relevant_evidence.length})
            </h3>
          </div>
          <ChevronDown
            className={`h-4 w-4 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 ${
              showEvidence ? "rotate-180 text-zinc-900 dark:text-white" : ""
            }`}
          />
        </button>

        <AnimatePresence>
          {showEvidence && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-4 pt-4 border-t border-zinc-200 dark:border-white/10 space-y-3"
            >
              {relevant_evidence.length === 0 ? (
                <p className="text-xs text-zinc-500">No chunks retrieved yet.</p>
              ) : (
                relevant_evidence.map((chunk, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black/50 p-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-300"
                  >
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-200 dark:border-white/5 pb-1.5 mb-2">
                      <span className="uppercase font-bold text-zinc-600 dark:text-zinc-400">
                        Section: {chunk.section}
                      </span>
                      <span
                        className="rounded-full px-2 py-0.5 font-bold"
                        style={{
                          background: `${selectedModel.colors.primary}18`,
                          color: selectedModel.colors.primary,
                        }}
                      >
                        Similarity: {(chunk.similarity * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs font-sans text-zinc-800 dark:text-zinc-300 leading-relaxed">
                      {chunk.content}
                    </p>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
