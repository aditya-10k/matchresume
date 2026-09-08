"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Calendar, Trash2, Eye, X, Sparkles, Copy, Check } from "lucide-react";
import { Resume } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { useModel } from "@/context/ModelContext";

interface ResumeCardProps {
  resume: Resume;
  onDelete?: (id: string) => void;
}

export default function ResumeCard({ resume, onDelete }: ResumeCardProps) {
  const { selectedModel } = useModel();
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullText = resume.raw_text || resume.text_preview || "";

  const handleCopy = async () => {
    if (!fullText) return;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (confirm(`Remove "${resume.name}" from your vector career vault?`)) {
      setIsDeleting(true);
      try {
        await onDelete(resume.id);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ y: -3, transition: { duration: 0.2 } }}
        className="group relative flex flex-col justify-between rounded-3xl bg-white/80 dark:bg-black/40 p-5 shadow-lg dark:shadow-2xl backdrop-blur-2xl transition-all duration-300 hover:shadow-xl"
        style={{
          border: `1px solid ${selectedModel.colors.primary}25`,
        }}
      >
        <div>
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="relative flex h-11 w-11 items-center justify-center rounded-2xl group-hover:scale-105 transition-all shadow-inner"
                style={{
                  background: `${selectedModel.colors.primary}18`,
                  border: `1px solid ${selectedModel.colors.primary}35`,
                  color: selectedModel.colors.primary,
                }}
              >
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-tight group-hover:opacity-85 transition-opacity">
                  {resume.name}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono truncate max-w-[170px]">{resume.filename}</p>
              </div>
            </div>

            {/* Status indicator */}
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium transition-colors"
              style={{
                background: `${selectedModel.colors.primary}15`,
                border: `1px solid ${selectedModel.colors.primary}30`,
                color: selectedModel.colors.primary,
              }}
            >
              <Sparkles className="h-3 w-3" style={{ color: selectedModel.colors.primary }} />
              Indexed
            </span>
          </div>

          {/* Snippet Preview */}
          <div
            className="mt-4 rounded-2xl border bg-zinc-50 dark:bg-zinc-950/70 p-3.5 shadow-inner"
            style={{ borderColor: `${selectedModel.colors.primary}15` }}
          >
            <p className="text-xs leading-relaxed text-zinc-700 dark:text-zinc-300 line-clamp-3">
              {resume.text_preview || "No preview available."}
            </p>
          </div>
        </div>

        {/* Footer info & actions */}
        <div
          className="mt-5 flex items-center justify-between border-t pt-3 text-xs text-zinc-500 dark:text-zinc-400"
          style={{ borderColor: `${selectedModel.colors.primary}15` }}
        >
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
            <Calendar className="h-3.5 w-3.5" style={{ color: `${selectedModel.colors.primary}90` }} />
            <span>{formatDate(resume.created_at)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors hover:brightness-110 active:scale-95"
              style={{
                borderColor: `${selectedModel.colors.primary}30`,
                background: `${selectedModel.colors.primary}15`,
                color: selectedModel.colors.primary,
              }}
              title="Inspect text"
            >
              <Eye className="h-3 w-3" />
              <span>Inspect</span>
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-rose-500/20 hover:text-rose-500 dark:hover:text-rose-400 transition-colors disabled:opacity-50"
                title="Delete resume"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Inspect Modal */}
      <AnimatePresence>
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              className="relative z-10 flex flex-col w-full max-w-4xl max-h-[85vh] rounded-3xl border bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden"
              style={{ borderColor: `${selectedModel.colors.primary}35` }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between border-b px-6 py-4"
                style={{ borderColor: `${selectedModel.colors.primary}20` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border shadow-inner"
                    style={{
                      background: `${selectedModel.colors.primary}15`,
                      borderColor: `${selectedModel.colors.primary}30`,
                      color: selectedModel.colors.primary,
                    }}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-zinc-900 dark:text-white">{resume.name}</h3>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          background: `${selectedModel.colors.primary}15`,
                          color: selectedModel.colors.primary,
                        }}
                      >
                        {fullText.split(/\s+/).filter(Boolean).length} words
                      </span>
                    </div>
                    <p className="text-xs font-mono" style={{ color: `${selectedModel.colors.primary}90` }}>
                      {resume.filename}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    style={{ borderColor: `${selectedModel.colors.primary}25` }}
                    title="Copy full text"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="rounded-full p-2 text-zinc-400 hover:bg-black/5 dark:hover:bg-white/10 hover:text-zinc-800 dark:hover:text-white transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content Body */}
              <div className="flex-1 overflow-y-auto p-6 bg-zinc-50/50 dark:bg-black/40">
                <pre className="font-mono text-xs text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap select-text selection:bg-blue-500/30">
                  {fullText || "No readable content extracted for this resume."}
                </pre>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between border-t px-6 py-3.5 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm"
                style={{ borderColor: `${selectedModel.colors.primary}20` }}
              >
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                  {fullText.length.toLocaleString()} characters | Ingested into Vector Vault
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded-full border px-5 py-1.5 text-xs font-semibold transition-all hover:brightness-110 active:scale-95 shadow-sm"
                  style={{
                    borderColor: `${selectedModel.colors.primary}30`,
                    background: `${selectedModel.colors.primary}20`,
                    color: selectedModel.colors.primary,
                  }}
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
