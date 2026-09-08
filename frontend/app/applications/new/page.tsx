"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Briefcase,
  Sparkles,
  FileText,
  Bot,
  Zap,
  UploadCloud,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { useModel } from "@/context/ModelContext";
import { createApplication, createApplicationFromPdf, analyzeApplication } from "@/lib/api/applications";
import AgentProgressTimeline from "@/components/agent/AgentProgressTimeline";

function NewApplicationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedModel } = useModel();

  const [jdText, setJdText] = useState("");
  const [company, setCompany] = useState("");
  const [roleTitle, setRoleTitle] = useState("");
  const [agentEnabled, setAgentEnabled] = useState(true);
  const [uploadedPdf, setUploadedPdf] = useState<File | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // Preload from search params if passed from dashboard
  useEffect(() => {
    const jdFromParam = searchParams.get("jd");
    if (jdFromParam) {
      setJdText(decodeURIComponent(jdFromParam));
    }
  }, [searchParams]);

  const handleStartAnalysis = async () => {
    if (!uploadedPdf && (!jdText || !jdText.trim())) {
      setErrorMessage("Please paste a job description or drop a JD PDF.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage("");
      setCurrentStepIndex(0);

      // Step 1: Create application
      let application;
      if (uploadedPdf) {
        application = await createApplicationFromPdf(uploadedPdf, company, roleTitle, agentEnabled);
      } else {
        application = await createApplication({
          jd_text: jdText.trim(),
          company: company.trim() || undefined,
          role_title: roleTitle.trim() || undefined,
          agent_enabled: agentEnabled,
        });
      }

      // Progress animation pacing
      setCurrentStepIndex(1);
      await new Promise((r) => setTimeout(r, 600));

      setCurrentStepIndex(2);
      await new Promise((r) => setTimeout(r, 700));

      // Step 2: Trigger backend analysis
      await analyzeApplication(application.id);

      setCurrentStepIndex(3);
      await new Promise((r) => setTimeout(r, 500));

      // Step 3: Redirect to Application Workspace
      router.push(`/applications/${application.id}`);
    } catch (err: any) {
      setIsAnalyzing(false);
      setErrorMessage(err.message || "Analysis failed. Ensure backend is running.");
    }
  };

  const handlePdfSelected = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are supported.");
      return;
    }
    setUploadedPdf(file);
    setErrorMessage("");
  };

  return (
    <div className="relative mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Dynamic Background Aura */}
      <div
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full blur-[120px] -z-10 transition-colors duration-700"
        style={{
          backgroundColor: selectedModel.colors.primary,
          opacity: 0.15,
        }}
      />

      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Analyze Position
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
          Input the target job description. Aira will extract requirements, search your vector career vault, and select the optimal resume.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="analyzing-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="py-12"
          >
            <AgentProgressTimeline currentStepIndex={currentStepIndex} />
          </motion.div>
        ) : (
          <motion.div
            key="form-state"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="flex flex-col gap-6"
          >
            {/* Error banner */}
            {errorMessage && (
              <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4 text-xs text-rose-300">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Optional Metadata Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Company Name (Optional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Google, DeepMind, Stripe"
                  className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/50 px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none transition-all"
                  style={{ borderColor: `${selectedModel.colors.primary}35` }}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Target Role (Optional)</label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. Senior AI Engineer"
                  className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/50 px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none transition-all"
                  style={{ borderColor: `${selectedModel.colors.primary}35` }}
                />
              </div>
            </div>

            {/* Main JD Input Area */}
            <div
              className="rounded-3xl border bg-white/80 dark:bg-black/50 p-6 shadow-xl dark:shadow-2xl backdrop-blur-2xl transition-all"
              style={{ borderColor: `${selectedModel.colors.primary}25` }}
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/10 pb-3 mb-4">
                <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                  <FileText className="h-4 w-4" style={{ color: selectedModel.colors.primary }} />
                  Job Description Content
                </span>

                {/* Optional sample loader */}
                <button
                  type="button"
                  onClick={() =>
                    setJdText(
                      `Senior AI Engineer - Generative Systems\n\nAbout the Role:\nWe are seeking an experienced AI Engineer to design and deploy agentic RAG workflows and autonomous LLM pipelines. You will collaborate directly with machine learning researchers to build production-grade search and retrieval infrastructure.\n\nRequired Qualifications:\n- 3+ years of experience with Python, FastAPI, and asynchronous backend development.\n- Deep practical expertise building RAG systems with vector databases (ChromaDB, Pinecone, or pgvector).\n- Experience with LangChain, LlamaIndex, or autonomous agent frameworks.\n- Strong understanding of embedding models, reranking, and semantic chunking strategies.\n\nPreferred Qualifications:\n- Experience with Docker, Kubernetes, and cloud deployment on GCP or AWS.\n- Familiarity with LaTeX compilation and automated document generation.\n- Publications or open-source contributions in generative AI.`
                    )
                  }
                  className="text-[11px] font-medium transition-colors hover:underline"
                  style={{ color: selectedModel.colors.primary }}
                >
                  Load Sample AI Job
                </button>
              </div>

              <textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                rows={9}
                placeholder="Paste the raw job description requirements, responsibilities, and qualifications here..."
                className="w-full bg-transparent text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none leading-relaxed resize-y"
              />

              {/* Or PDF dropzone */}
              <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400">
                  <UploadCloud className="h-4 w-4 text-zinc-400 dark:text-zinc-500" />
                  <span>Or upload as PDF:</span>
                  {uploadedPdf && (
                    <span
                      className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                      style={{
                        background: `${selectedModel.colors.primary}18`,
                        color: selectedModel.colors.primary,
                      }}
                    >
                      {uploadedPdf.name}
                    </span>
                  )}
                </div>

                <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-full border border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/5 px-3 py-1.5 text-xs text-zinc-700 dark:text-zinc-300 hover:bg-black/10 dark:hover:bg-white/10 transition-colors">
                  <span>Browse PDF</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handlePdfSelected(e.target.files[0])}
                  />
                </label>
              </div>
            </div>

            {/* Agent Mode Toggle */}
            <div
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border bg-white/80 dark:bg-black/40 p-5 shadow-lg dark:shadow-xl backdrop-blur-xl transition-all"
              style={{ borderColor: `${selectedModel.colors.primary}20` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    background: `${selectedModel.colors.primary}15`,
                    border: `1px solid ${selectedModel.colors.primary}30`,
                    color: selectedModel.colors.primary,
                  }}
                >
                  {agentEnabled ? <Bot className="h-5 w-5" /> : <Zap className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
                      {agentEnabled ? "Agent Mode (Autonomous Orchestration)" : "Baseline Mode (Deterministic RAG)"}
                    </h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase"
                      style={{
                        background: `${selectedModel.colors.primary}20`,
                        color: selectedModel.colors.primary,
                      }}
                    >
                      {agentEnabled ? "Agent ON" : "Agent OFF"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-zinc-600 dark:text-zinc-400 max-w-lg">
                    {agentEnabled
                      ? "Orchestrates multi-agent reasoning: JD Analyzer parses requirements, RAG retrieves targeted evidence, Selector scores fit and missing gaps."
                      : "Direct keyword and embedding extraction without iterative multi-agent reflection."}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                type="button"
                onClick={() => setAgentEnabled((prev) => !prev)}
                className={`relative inline-flex h-6 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  agentEnabled ? "bg-orange-500/80 dark:bg-white/20" : "bg-zinc-300 dark:bg-zinc-800"
                }`}
                style={agentEnabled ? { backgroundColor: selectedModel.colors.primary } : {}}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    agentEnabled ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Launch Action Button */}
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleStartAnalysis}
                className="inline-flex items-center gap-2.5 rounded-full px-8 py-3 text-xs font-semibold text-white shadow-xl hover:brightness-110 active:scale-95 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                  boxShadow: `0 8px 30px ${selectedModel.colors.primary}45`,
                }}
              >
                <Sparkles className="h-4 w-4" />
                <span>Analyze Position & Find Best Resume</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NewApplicationPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-zinc-500">Loading Studio...</div>}>
      <NewApplicationContent />
    </Suspense>
  );
}
