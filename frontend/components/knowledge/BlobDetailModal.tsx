"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Sparkles,
  Layers,
  Briefcase,
  Code2,
  CheckCircle2,
  ExternalLink,
  Cpu,
  BookmarkCheck,
  Compass,
} from "lucide-react";
import { KnowledgeNode } from "@/lib/api/knowledge";
import { useModel } from "@/context/ModelContext";

interface BlobDetailModalProps {
  node: KnowledgeNode | null;
  onClose: () => void;
  onSelectRelated: (nodeName: string) => void;
}

export default function BlobDetailModal({
  node,
  onClose,
  onSelectRelated,
}: BlobDetailModalProps) {
  const { selectedModel } = useModel();

  if (!node) return null;

  const getCategoryConfig = (cat: string) => {
    switch (cat) {
      case "skills":
        return {
          icon: Code2,
          color: "#10b981",
          label: "Verified Technical Skill",
          bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        };
      case "projects":
        return {
          icon: Cpu,
          color: "#3b82f6",
          label: "Engineered System / Project",
          bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        };
      case "experience":
        return {
          icon: Briefcase,
          color: "#f59e0b",
          label: "Professional Work Experience",
          bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        };
      case "domains":
      default:
        return {
          icon: Compass,
          color: "#8b5cf6",
          label: "Core Engineering Domain",
          bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
        };
    }
  };

  const config = getCategoryConfig(node.category);
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          layoutId={`blob-${node.id}`}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="relative w-full max-w-2xl rounded-3xl border bg-white/95 dark:bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[90vh] flex flex-col"
          style={{ borderColor: `${config.color}40` }}
        >
          {/* Subtle background glow */}
          <div
            className="absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
            style={{ background: config.color }}
          />

          {/* Header */}
          <div className="flex items-start justify-between pb-4 border-b border-zinc-200 dark:border-white/10 relative z-10">
            <div className="flex items-center gap-3.5">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-inner"
                style={{
                  background: `${config.color}20`,
                  color: config.color,
                  border: `1px solid ${config.color}35`,
                }}
              >
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${config.bg}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">
                    {node.sub_category}
                  </span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white mt-1">
                  {node.name}
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="rounded-full p-2 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/10 hover:text-zinc-700 dark:hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="mt-5 space-y-6 overflow-y-auto pr-1 flex-1 relative z-10">
            {/* Executive Punchline */}
            <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/5">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Executive Overview
              </div>
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {node.highlight}
              </p>
            </div>

            {/* Proficiency / Prominence Bar */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-zinc-500">Vector Grounding & Depth</span>
                <span className="font-mono font-bold" style={{ color: config.color }}>
                  {node.level} • {node.weight}% Prominence
                </span>
              </div>
              <div className="h-2 w-full bg-zinc-200 dark:bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${node.weight}%`,
                    background: config.color,
                  }}
                />
              </div>
            </div>

            {/* Grounded RAG Evidence Snippets */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <BookmarkCheck className="h-4 w-4 text-emerald-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  Grounded Evidence in RAG Database
                </h3>
              </div>
              <div className="space-y-2">
                {node.evidence_snippets.length > 0 ? (
                  node.evidence_snippets.map((snippet, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-50/70 dark:bg-white/[0.02] border border-zinc-200 dark:border-white/5 text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed"
                    >
                      <span className="h-1.5 w-1.5 rounded-full mt-1.5 shrink-0" style={{ background: config.color }} />
                      <span>{snippet}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-zinc-400 italic">No specific snippets indexed for this node.</p>
                )}
              </div>
            </div>

            {/* Related Skills / Connected Nodes */}
            {node.related_nodes && node.related_nodes.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                    Interconnected Skills & Architecture
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {node.related_nodes.map((rel, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectRelated(rel)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-white/5 hover:bg-zinc-200 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-white/10 transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                    >
                      <span>{rel}</span>
                      <ExternalLink className="h-3 w-3 opacity-50" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Source Badge */}
          <div className="mt-5 pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between text-xs text-zinc-400 relative z-10">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Verified in Candidate Vector Index
            </span>
            <span className="font-mono text-[11px] text-zinc-500 truncate max-w-[200px]">
              {node.source_resume}
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
