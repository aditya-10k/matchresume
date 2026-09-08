"use client";

import React, { useState, useEffect } from "react";
import { X, Sliders, Check, Loader2, Sparkles, Plus, Trash2 } from "lucide-react";
import { getPreferences, savePreference, deletePreference } from "@/lib/api/preferences";
import { UserPreference } from "@/lib/types";

interface PreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const [preferences, setPreferences] = useState<UserPreference[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Quick settings state
  const [pageLimit, setPageLimit] = useState<string>("one_page");
  const [bulletStyle, setBulletStyle] = useState<string>("metrics_focused");
  const [customRule, setCustomRule] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      loadPrefs();
    }
  }, [isOpen]);

  const loadPrefs = async () => {
    setLoading(true);
    try {
      const data = await getPreferences();
      setPreferences(data);
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

  const handleAddCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRule.trim()) return;
    const ruleKey = `custom_${Date.now()}`;
    await handleUpdate(ruleKey, customRule.trim());
    setCustomRule("");
  };

  if (!isOpen) return null;

  const customRules = preferences.filter((p) => p.key.startsWith("custom_"));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Tailoring Memory & Preferences
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Persistent guardrails injected into all resume generator agents
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-zinc-400 gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            <span className="text-xs">Loading preferences...</span>
          </div>
        ) : (
          <div className="py-4 space-y-5 max-h-[70vh] overflow-y-auto pr-1">
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

              <form onSubmit={handleAddCustom} className="flex gap-2">
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

        <div className="pt-3 border-t border-zinc-100 dark:border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold hover:opacity-90 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
