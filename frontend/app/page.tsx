"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Plus,
  Briefcase,
  Layers,
  CheckCircle2,
  FileText,
  SlidersHorizontal,
  Send,
  Cpu
} from "lucide-react";
import { fetchResumes } from "@/lib/api/resumes";
import { Resume } from "@/lib/types";
import IntelligenceOrb from "@/components/ui/IntelligenceOrb";
import ResumeCard from "@/components/resumes/ResumeCard";

export default function DashboardPage() {
  const router = useRouter();
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
    if (textToPass.trim()) {
      router.push(`/applications/new?jd=${encodeURIComponent(textToPass.trim())}`);
    } else {
      router.push("/applications/new");
    }
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
      {/* Top Ambient Glow Background */}
      <div className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-orange-600/15 blur-[120px] -z-10" />

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
            status={isOrbActive ? "Aira is analyzing career knowledge..." : "Aira intelligence core ready"}
            isProcessing={isOrbActive}
            onClick={() => setIsOrbActive((prev) => !prev)}
          />
        </motion.div>

        {/* Expressive Display Headline (Matching Screenshot) */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-2xl"
        >
          What are we <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500 bg-clip-text text-transparent">
            tailoring today?
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-3 text-xs sm:text-sm text-orange-200/60 max-w-lg"
        >
          Semantic career matching powered by RAG and autonomous agents. Pure verifiable experience in canonical LaTeX.
        </motion.p>
      </div>

      {/* Bento Preset Cards (Directly from Reference Screen 1) */}
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {presetCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + idx * 0.1 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            onClick={() => handleStartMatch(card.prompt)}
            className="group cursor-pointer rounded-3xl border border-orange-500/15 bg-black/40 p-5 shadow-xl backdrop-blur-xl transition-all hover:border-orange-500/40 hover:bg-orange-500/5 hover:shadow-[0_8px_30px_rgba(255,92,0,0.12)] flex flex-col justify-between"
          >
            <div>
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20 group-hover:scale-110 group-hover:bg-orange-500/20 transition-all">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-white tracking-tight group-hover:text-orange-200 transition-colors">
                {card.title}
              </h3>
              <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
                {card.subtitle}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-[11px] font-medium text-orange-400/80 group-hover:text-orange-300">
              <span>Launch</span>
              <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Floating Pill Input Bar (Directly from Reference Screen 1 & 2 bottom dock) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="sticky bottom-4 z-40 mt-12 w-full"
      >
        <div className="mx-auto flex max-w-3xl items-center justify-between rounded-full border border-orange-500/25 bg-black/75 p-2 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
          {/* Attachment / Info icon */}
          <Link
            href="/resumes"
            className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-orange-300 transition-colors"
            title="Browse Resumes"
          >
            <FileText className="h-4 w-4" />
          </Link>

          {/* Model Selector Pill */}
          <div className="flex items-center gap-1.5 rounded-full border border-orange-500/20 bg-orange-950/30 px-3 py-1.5 text-[11px] font-medium text-orange-300">
            <Cpu className="h-3 w-3 text-orange-400" />
            <span className="hidden xs:inline">Groq</span> Llama 3.3
          </div>

          {/* Input text field */}
          <input
            type="text"
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleStartMatch()}
            placeholder="Paste job description or ask Aira to tailor..."
            className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none"
          />

          {/* Glowing Circular Molten Action Button */}
          <button
            onClick={() => handleStartMatch()}
            className="relative flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-orange-600 text-white shadow-lg shadow-orange-600/40 ring-2 ring-orange-400/30 hover:scale-105 active:scale-95 transition-all"
            title="Analyze and Tailor"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Your Resumes Drawer / Vault Section */}
      <div className="mt-16 border-t border-orange-500/15 pt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              Career Vault
              <span className="rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/20">
                {resumes.length} Ingested
              </span>
            </h2>
            <p className="text-xs text-orange-200/50">Immutable resume knowledge bases for vector retrieval.</p>
          </div>
          <Link
            href="/resumes"
            className="flex items-center gap-1 text-xs font-medium text-orange-400 hover:text-orange-300 transition-colors"
          >
            <span>Open Vault</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-3xl border border-orange-500/15 bg-black/40 animate-pulse" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-orange-500/20 bg-black/30 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-orange-400/50" />
              <p className="mt-2 text-xs text-zinc-400">No resumes stored in your vector vault yet.</p>
              <Link
                href="/resumes"
                className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-orange-500/30 bg-orange-950/25 px-4 py-1.5 text-xs font-semibold text-orange-300 hover:bg-orange-500/20 transition-all"
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
