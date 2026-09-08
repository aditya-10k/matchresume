"use client";

import React, { useState, useRef, useEffect } from "react";
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
  const gutterRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activeLine, setActiveLine] = useState<number>(1);
  const [cursorPos, setCursorPos] = useState({ line: 1, col: 1 });

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
    const isTex = code.includes("\\documentclass") || code.includes("\\begin");
    const filename = isTex ? "tailored_resume.tex" : "tailored_resume.txt";
    const blob = new Blob([code], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Synchronize scroll position between textarea and line numbers gutter
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const updateCursorPosition = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const sel = target.selectionStart || 0;
    const textBefore = target.value.substring(0, sel);
    const lineNum = textBefore.split("\n").length;
    const colNum = (textBefore.split("\n").pop()?.length || 0) + 1;
    setActiveLine(lineNum);
    setCursorPos({ line: lineNum, col: colNum });
  };

  // Support Tab key indentation inside textarea
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + "  " + code.substring(end);
      onChange(newCode);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
        }
      }, 0);
    }
  };

  const lines = code.split("\n");

  return (
    <div
      className="flex h-full flex-col rounded-3xl border bg-white/90 dark:bg-zinc-950/90 shadow-2xl backdrop-blur-2xl overflow-hidden"
      style={{ borderColor: `${selectedModel.colors.primary}30` }}
    >
      {/* Editor Toolbar Header */}
      <div
        className="flex items-center justify-between border-b px-5 py-3 bg-zinc-50/80 dark:bg-black/50 shrink-0"
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
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              {code.includes("\\documentclass") ? "resume.tex" : "resume.txt"}
            </span>
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
            title="Copy source code"
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
            title="Download source file"
          >
            <Download className="h-3 w-3" />
            <span className="text-[11px]">{code.includes("\\documentclass") ? ".tex" : ".txt"}</span>
          </button>
        </div>
      </div>

      {/* Synchronized Editor Body with Real Scrolling Gutter */}
      <div className="relative flex-1 flex overflow-hidden font-mono text-xs min-h-0">
        {/* Line Numbers Gutter (Scroll synchronized via scrollTop) */}
        <div
          ref={gutterRef}
          aria-hidden="true"
          className="select-none py-4 px-2.5 text-right text-[11px] bg-zinc-100/70 dark:bg-black/50 border-r border-zinc-200 dark:border-white/5 font-mono overflow-hidden shrink-0 min-w-[48px]"
        >
          {lines.map((_, i) => {
            const lineNum = i + 1;
            const isActive = lineNum === activeLine;
            return (
              <div
                key={i}
                className={`leading-6 transition-colors ${
                  isActive
                    ? "text-orange-500 dark:text-orange-400 font-bold"
                    : "text-zinc-400 dark:text-zinc-600"
                }`}
              >
                {lineNum}
              </div>
            );
          })}
        </div>

        {/* Textarea Code Input with scroll listener */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            onChange(e.target.value);
            updateCursorPosition(e);
          }}
          onScroll={handleScroll}
          onSelect={updateCursorPosition}
          onClick={updateCursorPosition}
          onKeyUp={updateCursorPosition}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          className="flex-1 w-full resize-none py-4 px-3 leading-6 bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none overflow-y-auto overflow-x-auto selection:bg-orange-500/30 whitespace-pre font-mono"
        />
      </div>

      {/* Editor Status Footer: Line/Column indicator + Grounding */}
      <div
        className="border-t px-4 py-2 text-[11px] bg-zinc-50/90 dark:bg-zinc-950 flex items-center justify-between text-zinc-500 dark:text-zinc-400 shrink-0 font-mono"
        style={{ borderColor: `${selectedModel.colors.primary}15` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">
            Ln {cursorPos.line}, Col {cursorPos.col}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <span>{lines.length} total lines</span>
        </div>

        {validationReport && validationReport.feedback ? (
          <span className="truncate max-w-sm text-right text-emerald-500 dark:text-emerald-400">
            Factual Grounding: {validationReport.factual_score}%
          </span>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-600">UTF-8 • TeX / Plaintext</span>
        )}
      </div>
    </div>
  );
}
