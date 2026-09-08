"use client";

import { useState } from "react";
import { Copy, Check, Download, Code2, AlertTriangle, ShieldCheck } from "lucide-react";
import { useModel } from "@/context/ModelContext";

interface LaTeXEditorProps {
  code: string;
  onChange: (newCode: string) => void;
  validationReport?: {
    is_valid: boolean;
    latex_syntax_valid: boolean;
    factual_score: number;
    hallucinations_detected: string[];
    syntax_issues: string[];
    feedback: string;
  } | null;
}

export default function LaTeXEditor({
  code,
  onChange,
  validationReport,
}: LaTeXEditorProps) {
  const { selectedModel } = useModel();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tailored_resume.tex";
    link.click();
    URL.revokeObjectURL(url);
  };

  const lines = code.split("\n");

  return (
    <div className="flex h-full flex-col rounded-3xl border bg-white/90 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-2xl overflow-hidden"
      style={{ borderColor: `${selectedModel.colors.primary}30` }}
    >
      {/* Editor Toolbar Header */}
      <div
        className="flex items-center justify-between border-b px-5 py-3 bg-zinc-50/80 dark:bg-black/50"
        style={{ borderColor: `${selectedModel.colors.primary}20` }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg"
            style={{
              background: `${selectedModel.colors.primary}18`,
              color: selectedModel.colors.primary,
            }}
          >
            <Code2 className="h-4 w-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white">resume.tex</span>
            <span className="ml-2 text-[10px] text-zinc-400 font-mono">{lines.length} lines</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {validationReport && (
            <div
              className={`hidden sm:flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold border ${
                validationReport.is_valid
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-amber-500/30 bg-amber-500/10 text-amber-400"
              }`}
            >
              {validationReport.is_valid ? (
                <ShieldCheck className="h-3.5 w-3.5" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5" />
              )}
              <span>{validationReport.is_valid ? "Audit Passed (95%+)" : "Syntax Warning"}</span>
            </div>
          )}

          <button
            onClick={handleCopy}
            className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            style={{ borderColor: `${selectedModel.colors.primary}25` }}
            title="Copy LaTeX source"
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
            <span className="text-[11px]">{copied ? "Copied" : "Copy"}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors text-white"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
              borderColor: `${selectedModel.colors.primary}40`,
            }}
            title="Download .tex file"
          >
            <Download className="h-3 w-3" />
            <span className="text-[11px]">.tex</span>
          </button>
        </div>
      </div>

      {/* Editor Body with Line Numbers */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs">
        {/* Line Numbers Gutter */}
        <div className="select-none py-4 px-3 text-right text-[11px] text-zinc-400 dark:text-zinc-600 bg-zinc-100/60 dark:bg-black/40 border-r border-zinc-200 dark:border-white/5 font-mono overflow-hidden">
          {lines.map((_, i) => (
            <div key={i} className="leading-6">
              {i + 1}
            </div>
          ))}
        </div>

        {/* Textarea Code Input */}
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="flex-1 w-full resize-none p-4 leading-6 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none overflow-y-auto selection:bg-blue-500/30 whitespace-pre"
        />
      </div>

      {/* Footer Validation Status */}
      {validationReport && validationReport.feedback && (
        <div
          className="border-t px-4 py-2.5 text-[11px] bg-zinc-50/90 dark:bg-zinc-950 flex items-center justify-between text-zinc-600 dark:text-zinc-400"
          style={{ borderColor: `${selectedModel.colors.primary}15` }}
        >
          <span className="truncate max-w-md">{validationReport.feedback}</span>
          <span className="font-mono text-emerald-400 shrink-0">
            Factual Grounding: {validationReport.factual_score}%
          </span>
        </div>
      )}
    </div>
  );
}
