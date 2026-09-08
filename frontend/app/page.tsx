"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useModel } from "@/context/ModelContext";
import IntelligenceOrb from "@/components/ui/IntelligenceOrb";
import ModelSelector from "@/components/ui/ModelSelector";
import { createApplication, analyzeApplication } from "@/lib/api/applications";

export default function DashboardPage() {
  const router = useRouter();
  const { selectedModel } = useModel();
  const [promptInput, setPromptInput] = useState("");
  const [isOrbActive, setIsOrbActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleStartMatch = async (initialText?: string) => {
    const textToPass = initialText || promptInput;
    if (!textToPass || !textToPass.trim()) {
      setErrorMessage("Please paste a job description first.");
      return;
    }
    const words = textToPass.trim().split(/\s+/).filter(Boolean);
    if (words.length < 8) {
      setErrorMessage("Input is too brief. Please paste a realistic job description (minimum 8-10 words).");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setProcessingStatus(`Analyzing job requirements with ${selectedModel.name}...`);
      
      const app = await createApplication({
        jd_text: textToPass.trim(),
        agent_enabled: true,
      });

      setProcessingStatus(`Matching candidate profiles and RAG evidence...`);
      await analyzeApplication(app.id);

      setProcessingStatus(`Directing to results...`);
      router.push(`/applications/${app.id}`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to analyze position fit. Ensure your Groq API key is configured.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative mx-auto flex h-[calc(100vh-2rem)] max-w-4xl flex-col items-center justify-center px-4 select-none">
      {/* Main Centered Showcase */}
      <div className="flex flex-col items-center text-center w-full">
        {/* The Central Glowing Intelligence Orb */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <IntelligenceOrb
            size="lg"
            status={
              isProcessing
                ? processingStatus
                : isOrbActive
                ? `${selectedModel.name} is tailoring career knowledge...`
                : `${selectedModel.name} intelligence core ready`
            }
            isProcessing={isOrbActive || isProcessing}
            onClick={() => setIsOrbActive((prev) => !prev)}
          />
        </motion.div>

        {/* Expressive Display Headline with Dynamic Model Gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-white max-w-2xl"
        >
          What are we{" "}
          <span
            className={`bg-gradient-to-r ${selectedModel.colors.textAccent} bg-clip-text text-transparent transition-all duration-500`}
          >
            tailoring today?
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md text-center"
        >
          Autonomous multi-agent career matching. Zero hallucinated claims.
        </motion.p>

        {/* Floating Pill Input Bar */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full max-w-2xl mt-6 flex flex-col items-center gap-3"
        >
          {/* Error Notification Pill */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                className="flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-950/80 px-4 py-1.5 text-xs text-rose-200 shadow-xl backdrop-blur-xl"
              >
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Processing Status Pill */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                className="flex items-center gap-2.5 rounded-full border px-4 py-1.5 text-xs font-medium shadow-2xl backdrop-blur-xl"
                style={{
                  borderColor: `${selectedModel.colors.primary}40`,
                  background: `${selectedModel.colors.primary}20`,
                  color: selectedModel.colors.primary,
                }}
              >
                <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                <span>{processingStatus}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div
            className="flex w-full items-center justify-between rounded-full bg-white/90 dark:bg-black/80 p-2 shadow-xl dark:shadow-2xl backdrop-blur-2xl ring-1 ring-zinc-200/80 dark:ring-white/10 transition-all duration-500"
            style={{
              border: `1px solid ${selectedModel.colors.primary}35`,
              boxShadow: `0 20px 50px rgba(0,0,0,0.15), 0 0 25px ${selectedModel.colors.primary}20`,
            }}
          >
            {/* Model Selector Trigger inside Dock (opens upwards) */}
            <ModelSelector direction="up" />

            {/* Input text field */}
            <input
              type="text"
              value={promptInput}
              disabled={isProcessing}
              onChange={(e) => setPromptInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isProcessing && handleStartMatch()}
              placeholder="Paste job description to evaluate fit and tailor..."
              className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />

            {/* Action Button */}
            <button
              onClick={() => handleStartMatch()}
              disabled={isProcessing}
              className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-white shadow-lg ring-2 hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-60 disabled:hover:scale-100"
              style={{
                background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                boxShadow: `0 0 20px ${selectedModel.colors.primary}60`,
                borderColor: `${selectedModel.colors.primary}40`,
              }}
              title="Analyze and Tailor"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
