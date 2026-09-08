"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { X, Mail, Lock, User, Sparkles, AlertCircle, Loader2 } from "lucide-react";

export default function AuthModal() {
  const { isAuthModalOpen, closeAuthModal, login, register } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        await login(email, password);
      } else {
        await register(email, password, name);
      }
      setEmail("");
      setPassword("");
      setName("");
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 shadow-2xl overflow-hidden p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                {mode === "signin" ? "Sign In to matchresume" : "Create Account"}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {mode === "signin" ? "Access your resumes and applications" : "Start tailoring your resumes with AI agents"}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-lg bg-zinc-100 dark:bg-zinc-800/60 p-1 my-4">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
              mode === "signin"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(null); }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
              mode === "signup"
                ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-semibold shadow-md shadow-orange-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>{mode === "signin" ? "Sign In" : "Get Started"}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
