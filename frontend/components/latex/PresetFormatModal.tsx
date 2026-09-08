"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Layout,
  Check,
  Code2,
  Sparkles,
  FileText,
  FileCode,
  Layers,
  RefreshCw,
} from "lucide-react";
import { useModel } from "@/context/ModelContext";
import { RESUME_PRESETS, ResumePreset, DEFAULT_PRESET_ID } from "@/lib/resume-presets";

interface PresetFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPresetId: string;
  onSelectPreset: (presetId: string, customTemplate?: string) => void;
  customTemplate?: string;
  isTailoring?: boolean;
}

export default function PresetFormatModal({
  isOpen,
  onClose,
  currentPresetId,
  onSelectPreset,
  customTemplate: initialCustomTemplate = "",
  isTailoring = false,
}: PresetFormatModalProps) {
  const { selectedModel } = useModel();
  const [activeTab, setActiveTab] = useState<"browse" | "custom">("browse");
  const [selectedId, setSelectedId] = useState<string>(currentPresetId || DEFAULT_PRESET_ID);
  const [customTemplateText, setCustomTemplateText] = useState<string>(initialCustomTemplate);

  if (!isOpen) return null;

  const handleApply = () => {
    if (activeTab === "custom" && customTemplateText.trim()) {
      onSelectPreset("custom", customTemplateText.trim());
    } else {
      onSelectPreset(selectedId);
    }
    onClose();
  };

  const handlePresetCardClick = (id: string) => {
    setSelectedId(id);
    const preset = RESUME_PRESETS.find((p) => p.id === id);
    if (preset && !customTemplateText) {
      setCustomTemplateText(preset.latexSkeleton);
    }
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
          className="relative w-full max-w-2xl rounded-3xl border bg-white/95 dark:bg-zinc-950/95 p-6 shadow-2xl backdrop-blur-2xl overflow-hidden max-h-[90vh] flex flex-col"
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
                <Layout className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                  Resume Format Presets
                </h2>
                <p className="text-xs text-zinc-500">
                  Select a proven ATS template or configure your custom LaTeX format
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

          {/* Tabs */}
          <div className="flex items-center gap-2 pt-4 pb-2">
            <button
              onClick={() => setActiveTab("browse")}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === "browse"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Browse Presets</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("custom");
                if (!customTemplateText) {
                  const current = RESUME_PRESETS.find((p) => p.id === selectedId) || RESUME_PRESETS[0];
                  setCustomTemplateText(current.latexSkeleton);
                }
              }}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition ${
                activeTab === "custom"
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Custom Format / Plaintext</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto py-3 space-y-3">
            {activeTab === "browse" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RESUME_PRESETS.map((preset) => {
                  const isSelected = selectedId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handlePresetCardClick(preset.id)}
                      className={`group relative flex flex-col justify-between rounded-2xl border p-4 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "ring-2 shadow-lg"
                          : "border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/40 hover:border-zinc-300 dark:hover:border-white/20"
                      }`}
                      style={{
                        borderColor: isSelected ? selectedModel.colors.primary : undefined,
                        background: isSelected ? `${selectedModel.colors.primary}0a` : undefined,
                      }}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                            style={{
                              background: `${selectedModel.colors.primary}18`,
                              color: selectedModel.colors.primary,
                            }}
                          >
                            {preset.badge}
                          </span>
                          {isSelected && (
                            <div
                              className="flex h-5 w-5 items-center justify-center rounded-full text-white"
                              style={{ background: selectedModel.colors.primary }}
                            >
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white mb-1">
                          {preset.name}
                        </h4>
                        <p className="text-[11px] text-zinc-500 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-zinc-200/50 dark:border-white/5 flex items-center justify-between text-[10px] text-zinc-400">
                        <span className="capitalize font-mono flex items-center gap-1">
                          {preset.templateFormat === "plaintext" ? (
                            <FileText className="h-3 w-3" />
                          ) : (
                            <FileCode className="h-3 w-3" />
                          )}
                          {preset.templateFormat}
                        </span>
                        <span className="group-hover:text-zinc-700 dark:group-hover:text-zinc-200 transition-colors">
                          {isSelected ? "Active Preset" : "Click to select"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-50/80 dark:bg-zinc-900/50 p-3 text-xs text-zinc-500 space-y-1">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    Custom LaTeX or Plaintext Structure
                  </p>
                  <p className="text-[11px]">
                    Paste your target LaTeX template or Plaintext skeleton below. You can use standard sections or variable placeholders like <code>{"{{NAME}}"}</code>, <code>{"{{CONTACT}}"}</code>, <code>{"{{SKILLS}}"}</code>, <code>{"{{EXPERIENCE}}"}</code>, <code>{"{{PROJECTS}}"}</code>, <code>{"{{EDUCATION}}"}</code>.
                  </p>
                </div>

                <div className="relative">
                  <textarea
                    value={customTemplateText}
                    onChange={(e) => setCustomTemplateText(e.target.value)}
                    rows={12}
                    placeholder="Paste custom LaTeX code or Plaintext resume skeleton here..."
                    className="w-full rounded-2xl border border-zinc-200 dark:border-white/10 bg-zinc-900 text-zinc-100 font-mono text-xs p-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-inner"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-200 dark:border-white/10 flex items-center justify-between">
            <button
              onClick={onClose}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-white transition"
            >
              Cancel
            </button>

            <button
              onClick={handleApply}
              disabled={isTailoring}
              className="flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white shadow-lg transition hover:brightness-110 active:scale-95"
              style={{
                background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                boxShadow: `0 4px 14px ${selectedModel.colors.primary}40`,
              }}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isTailoring ? "animate-spin" : ""}`} />
              <span>Apply & Re-generate Resume</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
