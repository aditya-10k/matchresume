"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  X,
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
  Zap,
  Shield,
} from "lucide-react";

export default function BYOKModal() {
  const {
    isByokModalOpen,
    closeByokModal,
    groqKey,
    openRouterKey,
    user,
    setGroqApiKey,
    clearGroqApiKey,
    checkGroqKeyValid,
    setOpenRouterApiKey,
    clearOpenRouterApiKey,
    checkOpenRouterKeyValid,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<"groq" | "openrouter">("groq");

  // Groq Form State
  const [inputGroqKey, setInputGroqKey] = useState("");
  const [showGroqKey, setShowGroqKey] = useState(false);
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [testingGroq, setTestingGroq] = useState(false);
  const [groqTestResult, setGroqTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingGroq, setSavingGroq] = useState(false);

  // OpenRouter Form State
  const [inputOpenRouterKey, setInputOpenRouterKey] = useState("");
  const [showOpenRouterKey, setShowOpenRouterKey] = useState(false);
  const [testingOpenRouter, setTestingOpenRouter] = useState(false);
  const [openRouterTestResult, setOpenRouterTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savingOpenRouter, setSavingOpenRouter] = useState(false);

  useEffect(() => {
    if (groqKey) {
      setInputGroqKey(groqKey);
    } else if (user?.masked_key) {
      setInputGroqKey("");
    }
    if (openRouterKey) {
      setInputOpenRouterKey(openRouterKey);
    }
  }, [groqKey, openRouterKey, user, isByokModalOpen]);

  if (!isByokModalOpen) return null;

  // Groq handlers
  const handleTestGroq = async () => {
    const key = inputGroqKey.trim();
    if (!key) {
      setGroqTestResult({ success: false, message: "Please enter a Groq API key to test." });
      return;
    }
    setTestingGroq(true);
    setGroqTestResult(null);
    try {
      const res = await checkGroqKeyValid(key);
      setGroqTestResult({ success: res.valid, message: res.message });
    } catch (err: any) {
      setGroqTestResult({ success: false, message: err.message || "Failed to validate Groq key" });
    } finally {
      setTestingGroq(false);
    }
  };

  const handleSaveGroq = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = inputGroqKey.trim();
    if (!key) return;
    setSavingGroq(true);
    try {
      await setGroqApiKey(key, saveToAccount);
      setGroqTestResult({ success: true, message: "Groq key saved successfully." });
    } catch (err: any) {
      setGroqTestResult({ success: false, message: err.message || "Failed to save Groq key" });
    } finally {
      setSavingGroq(false);
    }
  };

  const handleClearGroq = async () => {
    if (confirm("Remove your stored Groq API key?")) {
      await clearGroqApiKey();
      setInputGroqKey("");
      setGroqTestResult(null);
    }
  };

  // OpenRouter handlers
  const handleTestOpenRouter = async () => {
    const key = inputOpenRouterKey.trim();
    if (!key) {
      setOpenRouterTestResult({ success: false, message: "Please enter an OpenRouter API key to test." });
      return;
    }
    setTestingOpenRouter(true);
    setOpenRouterTestResult(null);
    try {
      const res = await checkOpenRouterKeyValid(key);
      setOpenRouterTestResult({ success: res.valid, message: res.message });
    } catch (err: any) {
      setOpenRouterTestResult({ success: false, message: err.message || "Failed to validate OpenRouter key" });
    } finally {
      setTestingOpenRouter(false);
    }
  };

  const handleSaveOpenRouter = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = inputOpenRouterKey.trim();
    if (!key) return;
    setSavingOpenRouter(true);
    try {
      await setOpenRouterApiKey(key);
      setOpenRouterTestResult({ success: true, message: "OpenRouter key saved successfully." });
    } catch (err: any) {
      setOpenRouterTestResult({ success: false, message: err.message || "Failed to save OpenRouter key" });
    } finally {
      setSavingOpenRouter(false);
    }
  };

  const handleClearOpenRouter = async () => {
    if (confirm("Remove your stored OpenRouter API key?")) {
      await clearOpenRouterApiKey();
      setInputOpenRouterKey("");
      setOpenRouterTestResult(null);
    }
  };

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
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                API Keys (BYOK)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure your personal intelligence model keys
              </p>
            </div>
          </div>
          <button
            onClick={closeByokModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 my-4 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/60 dark:border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab("groq")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              activeTab === "groq"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-orange-500" />
            <span>Groq (Primary)</span>
            <span
              className={`w-2 h-2 rounded-full ${
                groqKey || user?.has_groq_key ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("openrouter")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition ${
              activeTab === "openrouter"
                ? "bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>OpenRouter (Failover)</span>
            <span
              className={`w-2 h-2 rounded-full ${
                openRouterKey ? "bg-emerald-500" : "bg-zinc-300 dark:bg-zinc-600"
              }`}
            />
          </button>
        </div>

        {/* Groq Tab Content */}
        {activeTab === "groq" && (
          <form onSubmit={handleSaveGroq} className="space-y-4">
            <div className="p-3 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Fastest inference for real-time resume tailoring and chat refinement.{" "}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400 hover:underline"
              >
                Get a free key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {(groqKey || user?.has_groq_key) && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">
                    Active:{" "}
                    <strong>
                      {groqKey ? `${groqKey.slice(0, 7)}...${groqKey.slice(-4)}` : user?.masked_key || "Configured"}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearGroq}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 hover:underline shrink-0 ml-2"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                Groq API Key (starts with <code className="text-orange-600 dark:text-orange-400 font-mono">gsk_</code>)
              </label>
              <div className="relative">
                <input
                  type={showGroqKey ? "text" : "password"}
                  value={inputGroqKey}
                  onChange={(e) => {
                    setInputGroqKey(e.target.value);
                    setGroqTestResult(null);
                  }}
                  placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowGroqKey(!showGroqKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showGroqKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {user && (
              <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-600 dark:text-zinc-400 select-none">
                <input
                  type="checkbox"
                  checked={saveToAccount}
                  onChange={(e) => setSaveToAccount(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500 border-zinc-300 dark:border-zinc-700"
                />
                <span>Save encrypted to my account for cross-device access</span>
              </label>
            )}

            {groqTestResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  groqTestResult.success
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                }`}
              >
                {groqTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{groqTestResult.message}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestGroq}
                disabled={testingGroq || !inputGroqKey.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {testingGroq ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <span>Test Key</span>
                )}
              </button>

              <button
                type="submit"
                disabled={savingGroq || !inputGroqKey.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {savingGroq ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Groq Key</span>
                )}
              </button>
            </div>
          </form>
        )}

        {/* OpenRouter Tab Content */}
        {activeTab === "openrouter" && (
          <form onSubmit={handleSaveOpenRouter} className="space-y-4">
            <div className="p-3 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/20 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
              Provides high-reliability backup and seamless failover when Groq experiences rate limits or downtime.{" "}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Get an OpenRouter key <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {openRouterKey && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="truncate">
                    Active:{" "}
                    <strong>
                      {openRouterKey.slice(0, 10)}...{openRouterKey.slice(-4)}
                    </strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearOpenRouter}
                  className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 hover:underline shrink-0 ml-2"
                >
                  <Trash2 className="w-3 h-3" /> Remove
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                OpenRouter API Key (starts with <code className="text-blue-600 dark:text-blue-400 font-mono">sk-or-v1-</code>)
              </label>
              <div className="relative">
                <input
                  type={showOpenRouterKey ? "text" : "password"}
                  value={inputOpenRouterKey}
                  onChange={(e) => {
                    setInputOpenRouterKey(e.target.value);
                    setOpenRouterTestResult(null);
                  }}
                  placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  className="w-full pl-3.5 pr-10 py-2.5 text-xs font-mono rounded-xl bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
                <button
                  type="button"
                  onClick={() => setShowOpenRouterKey(!showOpenRouterKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  {showOpenRouterKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {openRouterTestResult && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  openRouterTestResult.success
                    ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
                }`}
              >
                {openRouterTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{openRouterTestResult.message}</span>
              </div>
            )}

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestOpenRouter}
                disabled={testingOpenRouter || !inputOpenRouterKey.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {testingOpenRouter ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Testing...</span>
                  </>
                ) : (
                  <span>Test Key</span>
                )}
              </button>

              <button
                type="submit"
                disabled={savingOpenRouter || !inputOpenRouterKey.trim()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                {savingOpenRouter ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save OpenRouter Key</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
