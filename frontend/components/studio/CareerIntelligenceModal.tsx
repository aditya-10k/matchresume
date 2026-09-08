"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Database,
  ChevronDown,
  ChevronUp,
  Send,
  Loader2,
  Orbit,
  ArrowRight,
  ShieldCheck,
  Compass
} from "lucide-react";
import Link from "next/link";
import { useModel } from "@/context/ModelContext";
import { CareerQueryAnswer, queryCareerProfile } from "@/lib/api/career";

interface CareerIntelligenceModalProps {
  initialData: CareerQueryAnswer | null;
  isOpen: boolean;
  onClose: () => void;
  onSwitchToTailor?: () => void;
}

export default function CareerIntelligenceModal({
  initialData,
  isOpen,
  onClose,
  onSwitchToTailor,
}: CareerIntelligenceModalProps) {
  const { selectedModel } = useModel();
  const [data, setData] = useState<CareerQueryAnswer | null>(initialData);
  const [showEvidence, setShowEvidence] = useState(false);
  const [followupInput, setFollowupInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Sync data when initialData changes
  React.useEffect(() => {
    if (initialData) {
      setData(initialData);
      setError("");
    }
  }, [initialData]);

  if (!isOpen || !data) return null;

  const handleAskFollowup = async (queryText?: string) => {
    const q = (queryText || followupInput).trim();
    if (!q || loading) return;

    try {
      setLoading(true);
      setError("");
      const res = await queryCareerProfile(q);
      setData(res);
      setFollowupInput("");
    } catch (err: any) {
      setError(err.message || "Failed to get answer for follow-up.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop with Blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          style={{
            backgroundColor: "rgba(10, 5, 8, 0.92)",
            borderColor: `${selectedModel.colors.primary}40`,
            boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), 0 0 35px ${selectedModel.colors.primary}25`,
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-xl"
                style={{
                  background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                  color: "#fff",
                }}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    Career Profile Intelligence
                  </h3>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold flex items-center gap-1"
                    style={{
                      background: `${selectedModel.colors.primary}20`,
                      color: selectedModel.colors.primary,
                      border: `1px solid ${selectedModel.colors.primary}40`,
                    }}
                  >
                    <ShieldCheck className="h-3 w-3" />
                    ChromaDB Verified
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Synthesized via {data.model_used}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {/* User Question Pill */}
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0 mt-0.5">
                Q
              </div>
              <div className="text-sm font-semibold text-zinc-100 bg-white/5 px-4 py-2.5 rounded-2xl border border-white/10 max-w-[90%]">
                {data.query}
              </div>
            </div>

            {/* AI Synthesized Answer */}
            <div className="flex items-start gap-3">
              <div
                className="h-6 w-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm"
                style={{
                  background: selectedModel.colors.primary,
                  color: "#fff",
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="text-sm leading-relaxed text-zinc-200 whitespace-pre-line bg-black/40 p-4 rounded-2xl border border-white/5">
                  {data.answer}
                </div>

                {/* Grounded Evidence Toggle */}
                {data.evidence && data.evidence.length > 0 && (
                  <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
                    <button
                      onClick={() => setShowEvidence((prev) => !prev)}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="h-3.5 w-3.5 text-cyan-400" />
                        <span>
                          Verified Evidence Chunks ({data.evidence.length})
                        </span>
                      </div>
                      {showEvidence ? (
                        <ChevronUp className="h-4 w-4 text-zinc-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-zinc-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {showEvidence && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="px-4 pb-3 space-y-2 border-t border-white/5"
                        >
                          {data.evidence.map((ev, i) => (
                            <div
                              key={i}
                              className="text-xs p-2.5 rounded-xl bg-black/60 border border-white/5 space-y-1"
                            >
                              <div className="flex items-center justify-between text-[10px] text-zinc-400">
                                <span className="font-mono uppercase font-bold text-cyan-400">
                                  {ev.section}
                                </span>
                                <span>{ev.source_resume}</span>
                              </div>
                              <p className="text-zinc-300">{ev.content}</p>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Suggested Follow-up Prompts */}
                {data.suggested_followups && data.suggested_followups.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                      Suggested Follow-ups
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {data.suggested_followups.map((sf, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleAskFollowup(sf)}
                          disabled={loading}
                          className="text-xs px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-zinc-300 hover:text-white hover:border-white/25 transition-all text-left flex items-center gap-1.5 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                        >
                          <Compass className="h-3 w-3 text-cyan-400 shrink-0" />
                          <span>{sf}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="text-xs text-rose-400 bg-rose-950/50 border border-rose-500/30 p-3 rounded-xl">
                {error}
              </div>
            )}
          </div>

          {/* Follow-up Question Input Bar */}
          <div className="p-4 border-t border-white/10 bg-white/5 flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={followupInput}
                disabled={loading}
                onChange={(e) => setFollowupInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAskFollowup()}
                placeholder="Ask a follow-up about your skills or projects..."
                className="w-full bg-black/60 border border-white/15 rounded-full pl-4 pr-10 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-400 transition-all"
              />
              <button
                onClick={() => handleAskFollowup()}
                disabled={loading || !followupInput.trim()}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full text-white transition-opacity disabled:opacity-40"
                style={{ background: selectedModel.colors.primary }}
              >
                {loading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3 w-3" />
                )}
              </button>
            </div>

            <Link
              href="/knowledge"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-zinc-300 hover:text-white hover:border-white/25 transition-all shrink-0"
            >
              <Orbit className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Universe</span>
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
