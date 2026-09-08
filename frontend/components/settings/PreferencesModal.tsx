"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sliders,
  Check,
  Loader2,
  Sparkles,
  Plus,
  Trash2,
  Layout,
  FileCode,
  FileText,
  Layers,
  Code2,
  CheckCircle2,
} from "lucide-react";
import { getPreferences, savePreference, deletePreference } from "@/lib/api/preferences";
import { UserPreference } from "@/lib/types";
import { useModel } from "@/context/ModelContext";
import { RESUME_PRESETS, ResumePreset, DEFAULT_PRESET_ID } from "@/lib/resume-presets";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "presets" | "rules";
}

export default function PreferencesModal({
  isOpen,
  onClose,
  initialTab = "presets",
}: PreferencesModalProps) {
  const { selectedModel } = useModel();
  const [activeTab, setActiveTab] = useState<"presets" | "rules">(initialTab);
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // App-level Preset state
  const [defaultPresetId, setDefaultPresetId] = useState<string>(DEFAULT_PRESET_ID);
  const [customTemplateText, setCustomTemplateText] = useState<string>("");

  // Tailoring rules state
  const [pageLimit, setPageLimit] = useState<string>("one_page");
  const [bulletStyle, setBulletStyle] = useState<string>("metrics_focused");
  const [customRule, setCustomRule] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      loadPrefs();
    }
  }, [isOpen, initialTab]);

  const loadPrefs = async () => {
    setLoading(true);
    try {
      const data = await getPreferences();
      setPreferences(data);

      const presetPref = data.find((p) => p.key === "default_preset_id");
      if (presetPref) setDefaultPresetId(presetPref.value);

      const customPref = data.find((p) => p.key === "custom_template");
      if (customPref) setCustomTemplateText(customPref.value);

      const pagePref = data.find((p) => p.key === "page_limit");
      if (pagePref) setPageLimit(pagePref.value);

      const bulletPref = data.find((p) => p.key === "bullet_style");
      if (bulletPref) setBulletStyle(bulletPref.value);
    } catch (err) {
      console.warn("Failed to load user preferences:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key: string, value: string) => {
    setSavingKey(key);
    try {
      await savePreference(key, value);
      await loadPrefs();
    } catch (err) {
      console.error("Failed to save preference:", err);
    } finally {
      setSavingKey(null);
    }
  };

  const handleDelete = async (key: string) => {
    setSavingKey(key);
    try {
      await deletePreference(key);
      await loadPrefs();
    } catch (err) {
      console.error("Failed to delete preference:", err);
    } finally {
      setSavingKey(null);
    }
  };

  const handleSelectPreset = async (presetId: string) => {
    setDefaultPresetId(presetId);
    await handleUpdate("default_preset_id", presetId);
  };

  const handleSaveCustomTemplate = async () => {
    if (!customTemplateText.trim()) return;
    setDefaultPresetId("custom");
    await handleUpdate("default_preset_id", "custom");
    await handleUpdate("custom_template", customTemplateText.trim());
  };

  const handleAddCustomRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRule.trim()) return;
    const ruleKey = `custom_${Date.now()}`;
    await handleUpdate(ruleKey, customRule.trim());
    setCustomRule("");
  };

  if (!isOpen) return null;

  const customRules = preferences.filter((p) => p.key.startsWith("custom_"));
  const activePreset = RESUME_PRESETS.find((p) => p.id === defaultPresetId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ borderColor: `${selectedModel.colors.primary}30` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shadow-sm"
              style={{
                background: `${selectedModel.colors.primary}18`,
                color: selectedModel.colors.primary,
                border: `1px solid ${selectedModel.colors.primary}30`,
              }}
            >
              {activeTab === "presets" ? <Layout className="w-4 h-4" /> : <Sliders className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white">
                App-Level Settings & Presets
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure your global resume blueprint and permanent tailoring memory
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-white/10 px-6 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition -mb-[2px] ${
              activeTab === "presets"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Default Resume Preset</span>
            <span className="ml-1 rounded-full px-1.5 py-0.2 text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {defaultPresetId === "custom" ? "Custom" : activePreset?.shortName || "Default"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition -mb-[2px] ${
              activeTab === "rules"
                ? "border-orange-500 text-orange-600 dark:text-orange-400 font-extrabold"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tailoring Constraints</span>
            <span className="ml-1 rounded-full px-1.5 py-0.2 text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
              {customRules.length} rules
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-zinc-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
              <span className="text-xs">Loading app configuration...</span>
            </div>
          ) : activeTab === "presets" ? (
            /* TAB 1: Global Resume Format Presets */
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1">
                  Select Global Resume Preset
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Every new tailored resume across the app will automatically compile using this structural layout.
                </p>
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {RESUME_PRESETS.map((preset) => {
                  const isSelected = defaultPresetId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`relative flex flex-col justify-between p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? "border-orange-500 bg-orange-500/5 dark:bg-orange-500/10 shadow-md ring-1 ring-orange-500/40"
                          : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20 bg-zinc-50/50 dark:bg-zinc-900/40"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide bg-blue-500/10 text-blue-500 dark:text-blue-400 border border-blue-500/20">
                            {preset.badge}
                          </span>
                          {isSelected && (
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-white shadow-sm">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>

                        <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-snug">
                          {preset.name}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-3 leading-relaxed">
                          {preset.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-zinc-200/60 dark:border-white/5 flex items-center justify-between text-[11px]">
                        <span className="flex items-center gap-1 text-zinc-400">
                          {preset.templateFormat === "latex" ? <FileCode className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                          <span className="capitalize">{preset.templateFormat}</span>
                        </span>
                        <span className={`font-semibold text-[11px] ${isSelected ? "text-orange-600 dark:text-orange-400" : "text-zinc-400"}`}>
                          {isSelected ? "Active Default" : "Click to select"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Custom Blueprint Editor */}
              <div className="pt-4 border-t border-zinc-200 dark:border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5 text-orange-500" />
                      <span>Or Provide Custom LaTeX Blueprint</span>
                    </h4>
                    <p className="text-[11px] text-zinc-500">
                      Paste your custom Overleaf or university template using variables <code>{"{{NAME}}"}</code>, <code>{"{{SKILLS}}"}</code>, <code>{"{{EXPERIENCE}}"}</code>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCustomTemplate}
                    disabled={!customTemplateText.trim() || savingKey !== null}
                    className="px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
                  >
                    Save Custom
                  </button>
                </div>

                <textarea
                  value={customTemplateText}
                  onChange={(e) => setCustomTemplateText(e.target.value)}
                  placeholder="Paste \documentclass{article} ... custom LaTeX code here..."
                  rows={4}
                  className="w-full p-3 font-mono text-[11px] rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-black text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            </div>
          ) : (
            /* TAB 2: Tailoring Rules & Memory */
            <div className="space-y-5">
              {/* Page Limit Rule */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Target Page Length
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPageLimit("one_page");
                      handleUpdate("page_limit", "one_page");
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      pageLimit === "one_page"
                        ? "border-orange-500 bg-orange-500/5 dark:bg-orange-500/10"
                        : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                      <span>Strict 1-Page</span>
                      {pageLimit === "one_page" && <Check className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Trims bullet length & whitespace to never spill onto page 2
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPageLimit("standard");
                      handleUpdate("page_limit", "standard");
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      pageLimit === "standard"
                        ? "border-orange-500 bg-orange-500/5 dark:bg-orange-500/10"
                        : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                      <span>Standard (1-2 Pages)</span>
                      {pageLimit === "standard" && <Check className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Allows rich project and experience descriptions
                    </p>
                  </button>
                </div>
              </div>

              {/* Bullet Phrasing Style */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Bullet Style & Tone
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBulletStyle("metrics_focused");
                      handleUpdate("bullet_style", "metrics_focused");
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      bulletStyle === "metrics_focused"
                        ? "border-orange-500 bg-orange-500/5 dark:bg-orange-500/10"
                        : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                      <span>Metrics & ROI</span>
                      {bulletStyle === "metrics_focused" && <Check className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Quantified impact (e.g. "reduced latency by 40%")
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setBulletStyle("deep_tech");
                      handleUpdate("bullet_style", "deep_tech");
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      bulletStyle === "deep_tech"
                        ? "border-orange-500 bg-orange-500/5 dark:bg-orange-500/10"
                        : "border-zinc-200 dark:border-white/10 hover:border-zinc-300 dark:hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-zinc-900 dark:text-white">
                      <span>Technical Architecture</span>
                      {bulletStyle === "deep_tech" && <Check className="w-3.5 h-3.5 text-orange-500" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                      Highlights frameworks, algorithms, and design choices
                    </p>
                  </button>
                </div>
              </div>

              {/* Custom Rules / Constraints */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Custom Constraints & Persistent Instructions
                </label>

                {customRules.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {customRules.map((rule) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-white/10 text-xs"
                      >
                        <span className="text-zinc-800 dark:text-zinc-200">{rule.value}</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(rule.key)}
                          disabled={savingKey === rule.key}
                          className="text-zinc-400 hover:text-red-500 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <form onSubmit={handleAddCustomRule} className="flex gap-2">
                  <input
                    type="text"
                    value={customRule}
                    onChange={(e) => setCustomRule(e.target.value)}
                    placeholder="e.g. Always emphasize Next.js and distributed systems..."
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!customRule.trim() || savingKey !== null}
                    className="py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rule</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-zinc-400">
            {savingKey ? `Saving ${savingKey}...` : "Changes save automatically to your account"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-bold hover:opacity-90 transition shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
