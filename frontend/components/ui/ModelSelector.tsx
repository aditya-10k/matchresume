"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { useModel } from "@/context/ModelContext";

interface ModelSelectorProps {
  direction?: "up" | "down";
}

export default function ModelSelector({ direction = "down" }: ModelSelectorProps) {
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

  const positionClasses =
    direction === "up"
      ? "bottom-full mb-2.5 left-0 sm:left-auto sm:right-0 origin-bottom"
      : "top-full mt-2.5 right-0 origin-top";

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full border border-zinc-200 dark:border-white/15 bg-white/80 dark:bg-black/75 px-3.5 py-1.5 text-xs font-medium text-zinc-900 dark:text-white shadow-md dark:shadow-lg backdrop-blur-xl hover:border-zinc-300 dark:hover:border-white/30 active:scale-95 transition-all"
        style={{
          boxShadow: `0 0 15px ${selectedModel.colors.primary}25`,
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
          className={`h-3.5 w-3.5 text-zinc-500 dark:text-zinc-400 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-zinc-900 dark:text-white" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: direction === "up" ? 8 : -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: direction === "up" ? 8 : -8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-[100] w-72 sm:w-80 overflow-hidden rounded-3xl border border-zinc-200 dark:border-white/20 bg-white/95 dark:bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-3xl ${positionClasses}`}
            style={{
              boxShadow: `0 25px 60px rgba(0,0,0,0.15), 0 0 35px ${selectedModel.colors.primary}25`,
            }}
          >
            <div className="px-3.5 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-white/10 flex items-center justify-between">
              <span>Switch Intelligence Model</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: selectedModel.colors.primary }}
              />
            </div>

            <div className="mt-1 flex flex-col gap-1">
              {availableModels.map((model) => {
                const isSelected = model.id === selectedModelId;
                return (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => {
                      setSelectedModelId(model.id);
                      setIsOpen(false);
                    }}
                    className={`group flex items-start gap-3 rounded-2xl p-2.5 text-left transition-all ${
                      isSelected
                        ? "bg-zinc-100 dark:bg-white/10 border border-zinc-200 dark:border-white/20"
                        : "hover:bg-zinc-100/70 dark:hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    {/* Glowing Model Indicator */}
                    <div
                      className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                      style={{
                        background: `${model.colors.primary}20`,
                        border: `1px solid ${model.colors.primary}45`,
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
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                          {model.name}
                        </span>
                        <span
                          className="rounded-full px-2 py-0.5 text-[9px] font-semibold"
                          style={{
                            color: model.colors.primary,
                            background: `${model.colors.primary}18`,
                            border: `1px solid ${model.colors.primary}30`,
                          }}
                        >
                          {model.provider}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
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
