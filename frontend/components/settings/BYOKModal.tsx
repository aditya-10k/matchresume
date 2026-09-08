"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Key, ExternalLink, CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Trash2 } from "lucide-react";

export default function BYOKModal() {
  const {
    isByokModalOpen,
    closeByokModal,
    groqKey,
    user,
    setGroqApiKey,
    clearGroqApiKey,
    checkGroqKeyValid,
  } = useAuth();

  const [inputKey, setInputKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saveToAccount, setSaveToAccount] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (groqKey) {
      setInputKey(groqKey);
    } else if (user?.masked_key) {
      setInputKey("");
    }
  }, [groqKey, user, isByokModalOpen]);

  if (!isByokModalOpen) return null;

  const handleTestKey = async () => {
    const keyToTest = inputKey.trim();
    if (!keyToTest) {
      setTestResult({ success: false, message: "Please enter an API key to test." });
      return;
    }

    setTesting(true);
    setTestResult(null);
    try {
      const res = await checkGroqKeyValid(keyToTest);
      setTestResult({ success: res.valid, message: res.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Failed to validate key" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const keyToSave = inputKey.trim();
    if (!keyToSave) return;

    setSaving(true);
    try {
      await setGroqApiKey(keyToSave, saveToAccount);
      closeByokModal();
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || "Failed to save key" });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (confirm("Remove your Groq API key? Agents will not be able to generate or refine resumes until a new key is provided.")) {
      await clearGroqApiKey();
      setInputKey("");
      setTestResult(null);
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
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                Bring Your Own Key (BYOK)
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Configure your personal Groq API key
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

        {/* Informational banner */}
        <div className="my-4 p-3.5 rounded-xl bg-orange-500/5 dark:bg-orange-500/10 border border-orange-500/20 text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          <p className="font-semibold text-orange-700 dark:text-orange-400 mb-1">
            Zero-markups, zero key sharing
          </p>
          matchresume uses your key for high-speed Llama 3 analysis, resume tailoring, and chat refinement directly on Groq.
          {" "}
          <a
            href="https://console.groq.com/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-semibold text-orange-600 dark:text-orange-400 hover:underline"
          >
            Get a free Groq API key <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Current status badge */}
        {(groqKey || user?.has_groq_key) && (
          <div className="mb-4 flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Active Key:{" "}
                <strong>
                  {groqKey ? `${groqKey.slice(0, 7)}...${groqKey.slice(-4)}` : user?.masked_key || "Configured"}
                </strong>
              </span>
            </div>
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-red-500 hover:text-red-700 dark:hover:text-red-400 flex items-center gap-1 hover:underline"
            >
              <Trash2 className="w-3 h-3" /> Remove
            </button>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
              Groq API Key (starts with <code className="text-orange-600 dark:text-orange-400 font-mono">gsk_</code>)
            </label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={inputKey}
                onChange={(e) => {
                  setInputKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full pl-3.5 pr-10 py-2.5 text-sm font-mono rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
              <span>Save AES-256 encrypted to my account for cross-device access</span>
            </label>
          )}

          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                testResult.success
                  ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                  : "bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleTestKey}
              disabled={testing || !inputKey.trim()}
              className="flex-1 py-2.5 px-4 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating with Groq...</span>
                </>
              ) : (
                <span>Test Connection</span>
              )}
            </button>

            <button
              type="submit"
              disabled={saving || !inputKey.trim()}
              className="flex-1 py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-semibold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
