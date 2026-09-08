"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FileText,
  PlusCircle,
  Sparkles,
  ArrowRight,
  Briefcase,
  Layers,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Code2
} from "lucide-react";
import { fetchResumes } from "@/lib/api/resumes";
import { Resume } from "@/lib/types";
import ResumeCard from "@/components/resumes/ResumeCard";

export default function DashboardPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResumes()
      .then(setResumes)
      .catch(() => setResumes([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Hero Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-gradient-to-r from-zinc-900/90 via-indigo-950/30 to-purple-950/20 p-8 shadow-2xl backdrop-blur-md"
      >
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Resume Intelligence & RAG Engine</span>
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Tailor your resume with <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">verifiable truth</span>.
          </h1>
          <p className="mt-3 text-sm text-zinc-300 leading-relaxed">
            Index your career history into a factual vector knowledge base. Match against any job description, pinpoint skill gaps, and generate tailored LaTeX resumes without hallucinated facts.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/applications/new"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Briefcase className="h-4 w-4" />
              <span>Analyze New Position</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/resumes"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/70 px-4 py-2.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Manage Resume Library</span>
            </Link>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/15 blur-3xl" />
        <div className="pointer-events-none absolute right-40 -bottom-20 h-72 w-72 rounded-full bg-purple-500/15 blur-3xl" />
      </motion.div>

      {/* Metrics Row */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Knowledge Base</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{resumes.length}</span>
            <span className="text-xs text-zinc-500">Resumes Indexed</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">RAG Verification</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">100%</span>
            <span className="text-xs text-zinc-500">Factual Integrity Guard</span>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Orchestration</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
              <Cpu className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">Groq + LaTeX</span>
            <span className="text-xs text-zinc-500">Multi-Agent Ready</span>
          </div>
        </div>
      </div>

      {/* Your Resumes Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Your Resumes
              <span className="text-xs font-normal text-zinc-500">({resumes.length})</span>
            </h2>
            <p className="text-xs text-zinc-400">Original resumes used for semantic evidence retrieval.</p>
          </div>
          <Link
            href="/resumes"
            className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 animate-pulse" />
              ))}
            </div>
          ) : resumes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/20 p-8 text-center">
              <FileText className="mx-auto h-8 w-8 text-zinc-600" />
              <p className="mt-2 text-xs text-zinc-400">No resumes found in your library.</p>
              <Link
                href="/resumes"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-medium text-indigo-300 hover:bg-indigo-600/30 transition-colors"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                <span>Upload PDF</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {resumes.slice(0, 3).map((r) => (
                <ResumeCard key={r.id} resume={r} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Applications Section */}
      <div className="mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-zinc-100">Recent Applications</h2>
            <p className="text-xs text-zinc-400">Past job descriptions and tailored LaTeX versions.</p>
          </div>
          <Link
            href="/applications/new"
            className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>+ New Job Match</span>
          </Link>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/30 backdrop-blur-sm">
          <div className="p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-400">
              <Briefcase className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-semibold text-zinc-200">No active applications yet</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm mx-auto">
              Ready to apply? Paste a job description to trigger the JD Analyzer, determine the best resume, and tailor a targeted LaTeX resume.
            </p>
            <Link
              href="/applications/new"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Start Application Match</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
