"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Calendar, Trash2, Eye, CheckCircle2, X, Sparkles } from "lucide-react";
import { Resume } from "@/lib/types";
import { formatDate } from "@/lib/utils";

interface ResumeCardProps {
  resume: Resume;
  onDelete?: (id: string) => void;
}

export default function ResumeCard({ resume, onDelete }: ResumeCardProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
        className="group relative flex flex-col justify-between rounded-3xl border border-orange-500/15 bg-black/40 p-5 shadow-2xl backdrop-blur-2xl transition-all hover:border-orange-500/40 hover:shadow-[0_12px_40px_rgba(255,92,0,0.12)]"
      >
        <div>
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-600/15 to-transparent border border-orange-500/30 text-orange-400 group-hover:scale-105 transition-all shadow-inner">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white tracking-tight group-hover:text-orange-200 transition-colors">
                  {resume.name}
                </h3>
                <p className="text-[11px] text-zinc-400 font-mono truncate max-w-[170px]">{resume.filename}</p>
              </div>
            </div>

            {/* Status indicator */}
            <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-medium text-orange-300 border border-orange-500/25">
              <Sparkles className="h-3 w-3 text-orange-400" />
              Indexed
            </span>
          </div>

          {/* Snippet Preview */}
          <div className="mt-4 rounded-2xl border border-orange-500/10 bg-zinc-950/70 p-3.5 shadow-inner">
            <p className="text-xs leading-relaxed text-zinc-300 line-clamp-3">
              {resume.text_preview || "No preview available."}
            </p>
          </div>
        </div>

        {/* Footer info & actions */}
        <div className="mt-5 flex items-center justify-between border-t border-orange-500/10 pt-3 text-xs text-zinc-400">
          <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-medium">
            <Calendar className="h-3.5 w-3.5 text-orange-400/60" />
            <span>{formatDate(resume.created_at)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-950/20 px-3 py-1 text-[11px] text-orange-200 hover:bg-orange-500/20 hover:text-white transition-colors"
              title="Inspect text"
            >
              <Eye className="h-3 w-3" />
              <span>Inspect</span>
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-500 hover:bg-rose-500/20 hover:text-rose-400 transition-colors disabled:opacity-50"
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPreview(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-orange-500/30 bg-gradient-to-b from-zinc-950 via-black to-zinc-950 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-orange-500/15 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">{resume.name}</h3>
                    <p className="text-xs text-orange-300/60 font-mono">{resume.filename}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-2xl border border-orange-500/15 bg-black/70 p-4 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {resume.raw_text || resume.text_preview}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded-full border border-orange-500/20 bg-orange-950/30 px-5 py-1.5 text-xs font-medium text-orange-200 hover:bg-orange-500/20 transition-colors"
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
