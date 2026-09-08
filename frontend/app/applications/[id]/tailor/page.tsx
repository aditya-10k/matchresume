"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Sparkles,
  RefreshCw,
  FileCheck,
  Sliders,
  AlertCircle
} from "lucide-react";
import { useModel } from "@/context/ModelContext";
import {
  getApplication,
  tailorApplication,
  getTailoredResume,
  validateCustomLatex
} from "@/lib/api/applications";
import { Application } from "@/lib/types";
import LaTeXEditor from "@/components/latex/LaTeXEditor";
import LaTeXPreview from "@/components/latex/LaTeXPreview";

export default function LaTeXStudioPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;
  const { selectedModel } = useModel();

  const [application, setApplication] = useState<Application | null>(null);
  const [latexCode, setLatexCode] = useState<string>("");
  const [tailoredSummary, setTailoredSummary] = useState<string>("");
  const [highlightedSkills, setHighlightedSkills] = useState<string[]>([]);
  const [validationReport, setValidationReport] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const app = await getApplication(applicationId);
      setApplication(app);

      // Check if tailored LaTeX already generated
      const existing = await getTailoredResume(applicationId);
      if (existing && existing.latex_code) {
        setLatexCode(existing.latex_code);
        setTailoredSummary(existing.tailored_summary || "Synthesized canonical LaTeX resume.");
      } else {
        // Automatically trigger first synthesis
        await handleGenerateTailored();
      }
    } catch (err: any) {
      setError(err.message || "Failed to load resume tailoring studio.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTailored = async () => {
    try {
      setIsTailoring(true);
      setError("");
      const result = await tailorApplication(applicationId);
      setLatexCode(result.latex_code);
      setTailoredSummary(result.tailored_summary);
      setHighlightedSkills(result.highlighted_skills || []);
      setValidationReport(result.validation);
    } catch (err: any) {
      setError(err.message || "Failed to tailor resume with AI agents.");
    } finally {
      setIsTailoring(false);
    }
  };

  const handleCodeChange = async (newCode: string) => {
    setLatexCode(newCode);
    // Debounced or direct validation check
    try {
      const report = await validateCustomLatex(applicationId, newCode);
      setValidationReport(report);
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    if (applicationId) {
      loadData();
    }
  }, [applicationId]);

  if (loading || isTailoring) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
        <div
          className="h-12 w-12 rounded-full border-2 border-t-transparent animate-spin mb-4"
          style={{ borderColor: `${selectedModel.colors.primary} transparent transparent transparent` }}
        />
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
          {isTailoring ? "Resume Writer Agent Synthesizing LaTeX..." : "Loading LaTeX Studio..."}
        </h3>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
          {isTailoring
            ? `Grounding bullet points in candidate evidence and formatting canonical TeX with ${selectedModel.name}.`
            : "Initializing split-pane editor and client-side compiler."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-[calc(100vh-2rem)] max-w-7xl flex-col px-4 sm:px-6 lg:px-8">
      {/* Dynamic Ambient Background Glow */}
      <div
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full -z-10 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${selectedModel.colors.primary}20 0%, transparent 70%)`,
        }}
      />

      {/* Top Studio Control Bar */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b py-3 mb-4 transition-colors"
        style={{ borderColor: `${selectedModel.colors.primary}20` }}
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/applications/${applicationId}`}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/40 text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Back to Fit Analysis"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase"
                style={{
                  background: `${selectedModel.colors.primary}18`,
                  color: selectedModel.colors.primary,
                  border: `1px solid ${selectedModel.colors.primary}35`,
                }}
              >
                {selectedModel.name}
              </span>
              <span className="text-xs font-semibold text-zinc-500">
                {application?.company ? `@ ${application.company}` : "Tailored Application"}
              </span>
            </div>
            <h1 className="text-sm sm:text-base font-extrabold text-zinc-900 dark:text-white truncate max-w-md">
              {application?.role_title || "Target Position Resume Studio"}
            </h1>
          </div>
        </div>

        {/* Studio Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleGenerateTailored}
            disabled={isTailoring}
            className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all hover:brightness-110 active:scale-95 text-white"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
              borderColor: `${selectedModel.colors.primary}40`,
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTailoring ? "animate-spin" : ""}`} />
            <span>Regenerate LaTeX</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs text-rose-200">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Split-Pane Studio Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4 min-h-0 overflow-hidden">
        {/* Left Pane: Interactive LaTeX Code Editor */}
        <div className="h-full min-h-0 overflow-hidden">
          <LaTeXEditor
            code={latexCode}
            onChange={handleCodeChange}
            validationReport={validationReport}
          />
        </div>

        {/* Right Pane: Client-Side Compiled A4 Live Preview */}
        <div className="h-full min-h-0 overflow-hidden">
          <LaTeXPreview latexCode={latexCode} />
        </div>
      </div>
    </div>
  );
}
