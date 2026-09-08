"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Loader2, Sparkles, Brain, Search, Award } from "lucide-react";
import { useModel } from "@/context/ModelContext";

interface Step {
  id: string;
  label: string;
  desc: string;
  icon: any;
}

interface AgentProgressTimelineProps {
  currentStepIndex: number;
}

export default function AgentProgressTimeline({
  currentStepIndex,
}: AgentProgressTimelineProps) {
  const { selectedModel } = useModel();

  const steps: Step[] = [
    {
      id: "jd",
      label: "JD Analyzer Agent",
      desc: "Extracting core technical requirements, keywords, and qualifications...",
      icon: Brain,
    },
    {
      id: "rag",
      label: "RAG Career Evidence",
      desc: "Retrieving semantic evidence chunks from your ChromaDB knowledge vault...",
      icon: Search,
    },
    {
      id: "selector",
      label: "Resume Selector Agent",
      desc: "Evaluating candidate resumes and calculating skill intersection scores...",
      icon: Award,
    },
    {
      id: "done",
      label: "Recommendation Ready",
      desc: "Fit analysis compiled with identified strengths and missing gaps.",
      icon: Sparkles,
    },
  ];

  return (
    <div className="w-full max-w-xl mx-auto rounded-3xl border border-white/15 bg-black/60 p-6 shadow-2xl backdrop-blur-2xl">
      <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-3">
        <span
          className="h-2 w-2 rounded-full animate-pulse"
          style={{ backgroundColor: selectedModel.colors.primary }}
        />
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
          Agent Reasoning Pipeline Active
        </h4>
      </div>

      <div className="flex flex-col gap-5">
        {steps.map((step, idx) => {
          const isDone = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;

          const Icon = step.icon;

          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex items-start gap-4"
            >
              {/* Step indicator node */}
              <div
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl transition-all duration-500"
                style={{
                  background: isDone
                    ? `${selectedModel.colors.primary}25`
                    : isCurrent
                    ? `${selectedModel.colors.primary}35`
                    : "rgba(255,255,255,0.05)",
                  border: isCurrent
                    ? `1px solid ${selectedModel.colors.primary}`
                    : "1px solid rgba(255,255,255,0.1)",
                  boxShadow: isCurrent ? `0 0 15px ${selectedModel.colors.primary}40` : "none",
                }}
              >
                {isDone ? (
                  <CheckCircle2
                    className="h-4 w-4"
                    style={{ color: selectedModel.colors.primary }}
                  />
                ) : isCurrent ? (
                  <Loader2
                    className="h-4 w-4 animate-spin"
                    style={{ color: selectedModel.colors.primary }}
                  />
                ) : (
                  <Icon className="h-4 w-4 text-zinc-500" />
                )}
              </div>

              {/* Text descriptions */}
              <div className="flex-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <h5
                    className={`text-xs font-semibold tracking-tight transition-colors ${
                      isCurrent ? "text-white" : isDone ? "text-zinc-300" : "text-zinc-500"
                    }`}
                  >
                    {step.label}
                  </h5>
                  {isCurrent && (
                    <span
                      className="text-[10px] font-medium animate-pulse"
                      style={{ color: selectedModel.colors.primary }}
                    >
                      In progress...
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[11px] text-zinc-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
