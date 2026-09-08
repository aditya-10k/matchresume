"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Plus,
  FileText,
  Send,
  Cpu
} from "lucide-react";
import { fetchResumes } from "@/lib/api/resumes";
import { Resume } from "@/lib/types";
import { useModel } from "@/context/ModelContext";
import IntelligenceOrb from "@/components/ui/IntelligenceOrb";
import ModelSelector from "@/components/ui/ModelSelector";
import ResumeCard from "@/components/resumes/ResumeCard";

export default function DashboardPage() {
  const router = useRouter();
  const { selectedModel } = useModel();
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [promptInput, setPromptInput] = useState("");
  const [isOrbActive, setIsOrbActive] = useState(false);

  useEffect(() => {
    fetchResumes()
      .then(setResumes)
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  }, []);

  const handleStartMatch = (initialText?: string) => {
    const textToPass = initialText || promptInput;
    const queryParam = textToPass.trim() ? `?jd=${encodeURIComponent(textToPass.trim())}&model=${selectedModel.id}` : `?model=${selectedModel.id}`;
    router.push(`/applications/new${queryParam}`);
  };

  const presetCards = [
    {
      title: "Match JD against AI Resume",
      subtitle: "Evaluate skills and semantic fit against your specialized AI profile.",
      prompt: "Senior AI Engineer position requiring RAG, vector databases, and FastAPI.",
    },
    {
      title: "Analyze JD keyword gaps",
      subtitle: "Pinpoint missing requirements, frameworks, and qualifications.",
      prompt: "Backend & Distributed Systems Engineer requiring high throughput microservices.",
    },
    {
      title: "Tailor LaTeX with factual evidence",
      subtitle: "Synthesize a publication-quality resume without hallucinated claims.",
      prompt: "Full Stack Machine Learning Engineer with Next.js and PyTorch.",
    },
  ];

  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-between px-4 py-6 sm:px-6 lg:px-8">
      {/* Dynamic Atmospheric Glow Background mapped to current model color */}
      <div
        className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full blur-[130px] -z-10 transition-colors duration-700"
        style={{
          backgroundColor: selectedModel.colors.primary,
          opacity: 0.18,
        }}
      />

      {/* Main Hero Showcase */}
      <div className="flex flex-col items-center text-center mt-4 sm:mt-8">
        {/* The Central Glowing Intelligence Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <IntelligenceOrb
            size="hero"
            status={isOrbActive ? `${selectedModel.name} is tailoring career knowledge...` : `${selectedModel.name} intelligence core ready`}
            isProcessing={isOrbActive}
            onClick={() => setIsOrbActive((prev) => !prev)}
          />
        </motion.div>

        {/* Expressive Display Headline with Dynamic Model Gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-2xl"
        >
          What are we <br className="hidden sm:inline" />
          <span
            className={`bg-gradient-to-r ${selectedModel.colors.textAccent} bg-clip-text text-transparent transition-all duration-500`}
          >
            tailoring today?
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg"
        >
          Semantic career matching powered by RAG and autonomous agents. Pure verifiable experience in canonical LaTeX.
        </motion.p>
      </div>

      {/* Bento Preset Cards */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {presetCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => handleStartMatch(card.prompt)}
            className="group cursor-pointer rounded-3xl bg-white/80 dark:bg-black/40 p-5 shadow-lg dark:shadow-xl backdrop-blur-xl transition-all flex flex-col justify-between hover:shadow-xl dark:hover:shadow-2xl"
            style={{
              border: `1px solid ${selectedModel.colors.primary}25`,
            }}
          >
            <div>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-2xl transition-all group-hover:scale-110"
                style={{
                  background: `${selectedModel.colors.primary}18`,
                  border: `1px solid ${selectedModel.colors.primary}35`,
                  color: selectedModel.colors.primary,
                }}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-zinc-900 dark:text-white tracking-tight group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                {card.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {card.subtitle}
              </p>
            </div>
            <div
              className="mt-4 flex items-center gap-1 text-[11px] font-medium transition-colors"
              style={{ color: selectedModel.colors.primary }}
            >
              <span>Launch</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Pill Input Bar with Dynamic Model Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="sticky bottom-4 z-40 mt-12 w-full"
      >
        <div
          className="mx-auto flex max-w-3xl items-center justify-between rounded-full bg-white/90 dark:bg-black/80 p-2 shadow-xl dark:shadow-2xl backdrop-blur-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 transition-all duration-500"
          style={{
            border: `1px solid ${selectedModel.colors.primary}35`,
            boxShadow: `0 20px 50px rgba(0,0,0,0.15), 0 0 25px ${selectedModel.colors.primary}20`,
          }}
        >
          {/* File Vault shortcut */}
          <Link
            href="/resumes"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-zinc-500 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-900 dark:hover:text-white transition-colors"
            title="Browse Resumes"
          >
            <FileText className="h-4 w-4" />
          </Link>

          {/* Model Selector Trigger inside Dock (opens upwards) */}
          <ModelSelector direction="up" />

          {/* Input text field */}
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStartMatch()}
            placeholder="Paste job description or ask Aira to tailor..."
            className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />

          {/* Glowing Circular Molten Action Button */}
          <button
            onClick={() => handleStartMatch()}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-white shadow-lg ring-2 hover:scale-105 active:scale-95 transition-all duration-500"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
              boxShadow: `0 0 20px ${selectedModel.colors.primary}60`,
              borderColor: `${selectedModel.colors.primary}40`,
            }}
            title="Analyze and Tailor"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Career Vault Drawer */}
      <div className="mt-16 border-t border-zinc-200 dark:border-white/10 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
              Career Vault
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold transition-colors duration-500"
                style={{
                  background: `${selectedModel.colors.primary}18`,
                  color: selectedModel.colors.primary,
                  border: `1px solid ${selectedModel.colors.primary}35`,
                }}
              >
                {resumes.length} Ingested
              </span>
            </h2>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Immutable resume knowledge bases for vector retrieval.</p>
          </div>
          <Link
            href="/resumes"
            className="flex items-center gap-1 text-xs font-medium transition-colors"
            style={{ color: selectedModel.colors.primary }}
          >
            <span>Open Vault</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-black/40 animate-pulse" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 dark:border-white/15 bg-white/50 dark:bg-black/30 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-zinc-400 dark:text-zinc-600" />
              <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">No resumes stored in your vector vault yet.</p>
              <Link
                href="/resumes"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold text-white transition-all"
                style={{
                  borderColor: `${selectedModel.colors.primary}40`,
                  background: `${selectedModel.colors.primary}20`,
                }}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Upload First Resume</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {resumes.slice(0, 3).map((r) => (
                <ResumeCard key={r.id} resume={r} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
