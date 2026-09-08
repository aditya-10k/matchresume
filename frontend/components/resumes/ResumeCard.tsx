"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Calendar, Trash2, Eye, CheckCircle2, ChevronRight, X } from "lucide-react";
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
    if (confirm(`Are you sure you want to remove "${resume.name}"?`)) {
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
        className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/90 bg-gradient-to-b from-zinc-900/50 to-zinc-950/80 p-5 shadow-lg backdrop-blur-sm transition-all hover:border-zinc-700 hover:shadow-indigo-500/5"
      >
        <div>
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:scale-105 group-hover:bg-indigo-500/20 transition-all">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-white transition-colors">
                  {resume.name}
                </h3>
                <p className="text-[11px] text-zinc-500 truncate max-w-[180px]">{resume.filename}</p>
              </div>
            </div>

            {/* Status indicator */}
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="h-3 w-3" />
              Indexed
            </span>
          </div>

          {/* Snippet Preview */}
          <div className="mt-4 rounded-xl border border-zinc-800/60 bg-zinc-950/60 p-3">
            <p className="text-xs leading-relaxed text-zinc-400 line-clamp-3">
              {resume.text_preview || "No text preview available."}
            </p>
          </div>
        </div>

        {/* Footer info & actions */}
        <div className="mt-5 flex items-center justify-between border-t border-zinc-800/60 pt-3 text-xs text-zinc-500">
          <div className="flex items-center gap-1.5 text-[11px]">
            <Calendar className="h-3.5 w-3.5 text-zinc-600" />
            <span>{formatDate(resume.created_at)}</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              title="Inspect text"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Inspect</span>
            </button>
            {onDelete && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors disabled:opacity-50"
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
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-base font-semibold text-zinc-100">{resume.name}</h3>
                    <p className="text-xs text-zinc-400">{resume.filename}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-900/40 p-4 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                {resume.raw_text || resume.text_preview}
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  onClick={() => setShowPreview(false)}
                  className="rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
