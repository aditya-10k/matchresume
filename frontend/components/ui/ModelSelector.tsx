"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, Sparkles, Cpu } from "lucide-react";
import { useModel } from "@/context/ModelContext";

export default function ModelSelector() {
  const { selectedModel, selectedModelId, setSelectedModelId, availableModels } = useModel();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Pill Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-white/10 bg-black/60 px-3.5 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-xl hover:border-white/20 transition-all"
        style={{
          boxShadow: `0 0 15px ${selectedModel.colors.primary}20`,
        }}
      >
        {/* Glowing theme color dot */}
        <span
          className="h-2 w-2 rounded-full animate-pulse"
          style={{
            backgroundColor: selectedModel.colors.primary,
            boxShadow: `0 0 8px ${selectedModel.colors.primary}`,
          }}
        />

        <span className="font-semibold tracking-tight">{selectedModel.shortName}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full mb-3 left-0 sm:left-auto sm:right-0 z-50 w-72 sm:w-80 overflow-hidden rounded-3xl border border-white/15 bg-black/85 p-2 shadow-2xl backdrop-blur-2xl"
            style={{
              boxShadow: `0 20px 50px rgba(0,0,0,0.9), 0 0 30px ${selectedModel.colors.primary}15`,
            }}
          >
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-white/10">
              Select Agent Intelligence Model
            </div>

            <div className="mt-1 flex flex-col gap-1">
              {availableModels.map((model) => {
                const isSelected = model.id === selectedModelId;
                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      setSelectedModelId(model.id);
                      setIsOpen(false);
                    }}
                    className={`flex items-start gap-3 rounded-2xl p-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-white/10 border border-white/15"
                        : "hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {/* Glowing Model Indicator */}
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: `${model.colors.primary}20`,
                        border: `1px solid ${model.colors.primary}40`,
                      }}
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: model.colors.primary,
                          boxShadow: `0 0 8px ${model.colors.primary}`,
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {model.name}
                        </span>
                        <span
                          className="rounded-full px-1.5 py-0.2 text-[9px] font-medium"
                          style={{
                            color: model.colors.primary,
                            background: `${model.colors.primary}15`,
                          }}
                        >
                          {model.provider}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-400 line-clamp-1">
                        {model.tagline}
                      </p>
                    </div>

                    {isSelected && (
                      <Check
                        className="h-4 w-4 shrink-0 mt-1"
                        style={{ color: model.colors.primary }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
