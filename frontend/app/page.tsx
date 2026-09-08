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
import { useAuth } from "@/context/AuthContext";
import IntelligenceOrb from "@/components/ui/IntelligenceOrb";
import ModelSelector from "@/components/ui/ModelSelector";
import { createApplication, analyzeApplication } from "@/lib/api/applications";
import { dispatchStudioPrompt, CareerQueryAnswer } from "@/lib/api/career";
import CareerIntelligenceModal from "@/components/studio/CareerIntelligenceModal";

export default function DashboardPage() {
  const router = useRouter();
  const { selectedModel } = useModel();
  const { requireGroqKey } = useAuth();
  const [promptInput, setPromptInput] = useState("");
  const [isOrbActive, setIsOrbActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [careerAnswer, setCareerAnswer] = useState<CareerQueryAnswer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleStartMatch = async (initialText?: string) => {
    if (!requireGroqKey()) return;
    const textToPass = (initialText || promptInput).trim();
    if (!textToPass) {
      setErrorMessage("Please ask a profile question or paste a job description.");
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage("");
      setProcessingStatus(`Evaluating prompt with Guardrail & Classifier...`);

      // Node 1 & Node 2: Guardrail & Classifier Node Pipeline
      const dispatchRes = await dispatchStudioPrompt(textToPass);

      // Guardrail Check
      if (dispatchRes.status === "rejected") {
        setErrorMessage(
          dispatchRes.guardrail?.reason ||
          "Input was intercepted by security guardrail. Please provide a career-related prompt."
        );
        setIsProcessing(false);
        return;
      }

      // Classifier Node Decision
      if (dispatchRes.intent === "PROFILE_QUERY" && dispatchRes.profile_answer) {
        setProcessingStatus(`Synthesizing candidate profile intelligence...`);
        setCareerAnswer(dispatchRes.profile_answer);
        setIsModalOpen(true);
        setIsProcessing(false);
        return;
      }

      // If intent is JOB_DESCRIPTION: Proceed with Application Tailoring Pipeline
      setProcessingStatus(`Analyzing job requirements with ${selectedModel.name}...`);
      const app = await createApplication({
        jd_text: textToPass,
        agent_enabled: true,
      });

      setProcessingStatus(`Matching candidate profiles and RAG evidence...`);
      await analyzeApplication(app.id);

      setProcessingStatus(`Directing to results...`);
      router.push(`/applications/${app.id}`);
    } catch (err: any) {
      setErrorMessage(
        err.message || "Failed to process query. Please ensure your backend is active."
      );
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
                ? `${selectedModel.name} is querying career knowledge...`
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
            exploring today?
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-2 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md text-center"
        >
          Ask about your verified skills & projects, or paste a job description to tailor.
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
              placeholder="Ask a profile question (e.g. 'what is my best project?') or paste a job description..."
              className="flex-1 bg-transparent px-4 py-2 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none disabled:opacity-50"
            />

            {/* Action Button */}
            <button
              onClick={() => handleStartMatch()}
              disabled={isProcessing}
              className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full text-white shadow-lg ring-2 hover:scale-105 active:scale-95 transition-all duration-500 disabled:opacity-60 disabled:hover:scale-100 cursor-pointer"
              style={{
                background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                boxShadow: `0 0 20px ${selectedModel.colors.primary}60`,
                borderColor: `${selectedModel.colors.primary}40`,
              }}
              title="Execute with Intelligence Pipeline"
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

      {/* Floating Career Profile Intelligence Modal */}
      <CareerIntelligenceModal
        initialData={careerAnswer}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
