"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  FileCode,
  FileText,
  ClipboardPaste,
  Check,
  AlertCircle,
} from "lucide-react";
import { useModel } from "@/context/ModelContext";

interface ImportResumeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (content: string, detectedMode: "latex" | "plaintext") => void;
}

export default function ImportResumeModal({
  isOpen,
  onClose,
  onImport,
}: ImportResumeModalProps) {
  const { selectedModel } = useModel();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteText, setPasteText] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (file: File) => {
    setError("");
    const isTex = file.name.endsWith(".tex");
    const isTxt = file.name.endsWith(".txt") || file.name.endsWith(".md");

    if (!isTex && !isTxt) {
      setError("Please upload a .tex, .txt, or .md resume file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        const mode = isTex || text.includes("\\documentclass") || text.includes("\\section") ? "latex" : "plaintext";
        onImport(text, mode);
        onClose();
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) {
      setError("Please paste your resume code or text before importing.");
      return;
    }
    const isLatex = pasteText.includes("\\documentclass") || pasteText.includes("\\section") || pasteText.includes("\\begin");
    onImport(pasteText.trim(), isLatex ? "latex" : "plaintext");
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg rounded-3xl border bg-white/95 dark:bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl overflow-hidden"
          style={{ borderColor: `${selectedModel.colors.primary}35` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{
                  background: `${selectedModel.colors.primary}18`,
                  color: selectedModel.colors.primary,
                  border: `1px solid ${selectedModel.colors.primary}30`,
                }}
              >
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                  Import / Paste Resume
                </h2>
                <p className="text-xs text-zinc-500">
                  Upload an existing .tex file or paste plaintext to edit & render PDF
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-1.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/30 p-3 text-xs text-rose-600 dark:text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="py-4 space-y-4">
            {/* File Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileChange(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 cursor-pointer text-center transition ${
                dragActive
                  ? "border-orange-500 bg-orange-500/5"
                  : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-zinc-50/50 dark:bg-zinc-900/30"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".tex,.txt,.md"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 mb-2">
                <FileCode className="h-5 w-5" />
              </div>
              <p className="text-xs font-bold text-zinc-900 dark:text-white">
                Drop your <span className="text-orange-500">.tex</span> or <span className="text-orange-500">.txt</span> file here
              </p>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                or click to browse from your computer
              </p>
            </div>

            {/* Paste Area */}
            <div>
              <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5 flex items-center gap-1.5">
                <ClipboardPaste className="h-3.5 w-3.5 text-orange-500" />
                Or Paste Resume Code / Text Directly
              </label>
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={6}
                placeholder="Paste LaTeX document code or plaintext resume here..."
                className="w-full rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-900 text-zinc-100 font-mono text-xs p-3 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-inner"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between">
            <button
              onClick={onClose}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handlePasteSubmit}
              disabled={!pasteText.trim()}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-95 disabled:opacity-50"
              style={{
                background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                boxShadow: `0 4px 14px ${selectedModel.colors.primary}40`,
              }}
            >
              <Check className="h-3.5 w-3.5" />
              <span>Load into Editor & Render PDF</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
