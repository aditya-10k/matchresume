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
  AlertCircle,
  MessageSquare,
  Layout,
  Upload,
  FileText,
  FileCode,
} from "lucide-react";
import { useModel } from "@/context/ModelContext";
import { useAuth } from "@/context/AuthContext";
import {
  getApplication,
  tailorApplication,
  getTailoredResume,
  validateCustomLatex
} from "@/lib/api/applications";
import { getPreferences } from "@/lib/api/preferences";
import { Application } from "@/lib/types";
import LaTeXEditor from "@/components/latex/LaTeXEditor";
import LaTeXPreview, { OutputMode } from "@/components/latex/LaTeXPreview";
import { stripAsterisks, stripAsterisksList } from "@/lib/utils";
import ChatRefinementDrawer from "@/components/latex/ChatRefinementDrawer";
import PreferencesModal from "@/components/settings/PreferencesModal";
import LatexStudioSkeleton from "@/components/skeletons/LatexStudioSkeleton";
import PresetFormatModal from "@/components/latex/PresetFormatModal";
import ImportResumeModal from "@/components/latex/ImportResumeModal";
import { DEFAULT_PRESET_ID } from "@/lib/resume-presets";

export default function LaTeXStudioPage() {
  const params = useParams();
  const router = useRouter();
  const applicationId = params?.id as string;
  const { selectedModel } = useModel();
  const { user, token, hasGroqKey, requireGroqKey, requireAuth } = useAuth();

  const [application, setApplication] = useState<Application | null>(null);
  const [latexCode, setLatexCode] = useState<string>("");
  const [tailoredSummary, setTailoredSummary] = useState<string>("");
  const [highlightedSkills, setHighlightedSkills] = useState<string[]>([]);
  const [validationReport, setValidationReport] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [isTailoring, setIsTailoring] = useState(false);
  const [error, setError] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const [outputMode, setOutputMode] = useState<OutputMode>("latex");
  const [selectedPresetId, setSelectedPresetId] = useState<string>(DEFAULT_PRESET_ID);
  const [customTemplate, setCustomTemplate] = useState<string>("");

  const loadData = async () => {
    if (!token || !user) {
      setError("Please sign in to view and tailor this application.");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError("");

      const app = await getApplication(applicationId);
      setApplication(app);

      // Fetch user's app-level preferences
      let currentPreset = DEFAULT_PRESET_ID;
      let currentCustom = "";
      try {
        const prefs = await getPreferences();
        const presetPref = prefs.find((p) => p.key === "default_preset_id");
        if (presetPref?.value) {
          currentPreset = presetPref.value;
          setSelectedPresetId(presetPref.value);
        }
        const customPref = prefs.find((p) => p.key === "custom_template");
        if (customPref?.value) {
          currentCustom = customPref.value;
          setCustomTemplate(customPref.value);
        }
      } catch (err) {
        console.warn("Failed to fetch preferences in tailor page:", err);
      }

      // Check if tailored LaTeX already generated
      const existing = await getTailoredResume(applicationId);
      if (existing && existing.latex_code) {
        setLatexCode(existing.latex_code);
        setTailoredSummary(stripAsterisks(existing.tailored_summary || "Synthesized canonical LaTeX resume."));
        if (existing.latex_code.startsWith("#") || !existing.latex_code.includes("\\documentclass")) {
          setOutputMode("plaintext");
        }
      } else {
        // Automatically trigger first synthesis only if user already configured their Groq key
        if (hasGroqKey) {
          await handleGenerateTailored(currentPreset, currentCustom);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load resume tailoring studio.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTailored = async (presetId?: string, customTmpl?: string) => {
    if (!requireAuth()) return;
    if (!requireGroqKey()) return;
    try {
      setIsTailoring(true);
      setError("");
      const targetPreset = presetId || selectedPresetId;
      const targetCustom = customTmpl || customTemplate;
      const result = await tailorApplication(applicationId, {
        preset_id: targetPreset,
        custom_template: targetCustom,
        output_format: outputMode,
      });
      setLatexCode(result.latex_code);
      setTailoredSummary(stripAsterisks(result.tailored_summary));
      setHighlightedSkills(stripAsterisksList(result.highlighted_skills || []));
      setValidationReport(result.validation);
    } catch (err: any) {
      setError(err.message || "Failed to tailor resume with AI agents.");
    } finally {
      setIsTailoring(false);
    }
  };

  const handleCodeChange = async (newCode: string) => {
    setLatexCode(newCode);
    if (outputMode === "latex") {
      try {
        const report = await validateCustomLatex(applicationId, newCode);
        setValidationReport(report);
      } catch {
        // quiet fallback
      }
    }
  };

  const handleImportResume = (content: string, detectedMode: OutputMode) => {
    setLatexCode(content);
    setOutputMode(detectedMode);
  };

  const handleSelectPreset = async (presetId: string, customTmpl?: string) => {
    setSelectedPresetId(presetId);
    if (customTmpl) {
      setCustomTemplate(customTmpl);
    }
    if (presetId === "plaintext_standard") {
      setOutputMode("plaintext");
    } else if (presetId !== "custom") {
      setOutputMode("latex");
    }
    await handleGenerateTailored(presetId, customTmpl);
  };

  useEffect(() => {
    if (applicationId) {
      loadData();
    }
  }, [applicationId]);

  if (loading || isTailoring) {
    return <LatexStudioSkeleton />;
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
        <div className="flex flex-wrap items-center gap-2">
          {/* Format Mode Toggle */}
          <div className="flex items-center rounded-full border border-zinc-200 dark:border-white/10 p-0.5 bg-zinc-100/90 dark:bg-zinc-900/90 shadow-sm">
            <button
              onClick={() => setOutputMode("latex")}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                outputMode === "latex"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FileCode className="h-3 w-3" />
              <span>LaTeX (.tex)</span>
            </button>
            <button
              onClick={() => setOutputMode("plaintext")}
              className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                outputMode === "plaintext"
                  ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm font-bold"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <FileText className="h-3 w-3" />
              <span>Plaintext (.txt)</span>
            </button>
          </div>

          {/* Import / Paste Resume */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            title="Import existing .tex or plaintext resume"
          >
            <Upload className="h-3.5 w-3.5 text-blue-500" />
            <span className="hidden sm:inline">Import</span>
          </button>

          {/* Presets Button */}
          <button
            type="button"
            onClick={() => setIsPresetModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            title="Choose Resume Format Preset"
          >
            <Layout className="h-3.5 w-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Presets</span>
          </button>

          {/* Preferences Button */}
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(true)}
            className="flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-800/80 px-3 py-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition"
            title="Tailoring Preferences & Memory"
          >
            <Sliders className="h-3.5 w-3.5 text-orange-500" />
            <span className="hidden sm:inline">Preferences</span>
          </button>

          {/* AI Copilot Button */}
          <button
            type="button"
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
              isChatOpen
                ? "border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold"
                : "border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-800/80 text-zinc-700 dark:text-zinc-200 hover:border-orange-500/30"
            }`}
            title="Live Conversational AI Refinement"
          >
            <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
            <span>AI Copilot</span>
          </button>

          {/* Regenerate Button */}
          <button
            onClick={() => handleGenerateTailored()}
            disabled={isTailoring}
            className="flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold transition-all hover:brightness-110 active:scale-95 text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
              borderColor: `${selectedModel.colors.primary}40`,
            }}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isTailoring ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
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
        {/* Left Pane: Interactive LaTeX / Text Code Editor */}
        <div className="h-full min-h-0 overflow-hidden">
          <LaTeXEditor
            code={latexCode}
            onChange={handleCodeChange}
            validationReport={validationReport}
          />
        </div>

        {/* Right Pane: Client-Side Compiled A4 Live Preview */}
        <div className="h-full min-h-0 overflow-hidden">
          <LaTeXPreview latexCode={latexCode} mode={outputMode} />
        </div>
      </div>

      {/* Conversational Refinement Drawer */}
      <ChatRefinementDrawer
        applicationId={applicationId}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onLatexUpdated={handleCodeChange}
      />

      {/* Tailoring Preferences Modal */}
      <PreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />

      {/* Preset Format Modal */}
      <PresetFormatModal
        isOpen={isPresetModalOpen}
        onClose={() => setIsPresetModalOpen(false)}
        currentPresetId={selectedPresetId}
        onSelectPreset={handleSelectPreset}
        customTemplate={customTemplate}
        isTailoring={isTailoring}
      />

      {/* Import / Paste Resume Modal */}
      <ImportResumeModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportResume}
      />
    </div>
  );
}
