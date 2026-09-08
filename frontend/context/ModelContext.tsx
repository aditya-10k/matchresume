"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AI_MODELS, DEFAULT_MODEL_ID, AIModelConfig } from "@/lib/model-themes";

interface ModelContextType {
  selectedModel: AIModelConfig;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  availableModels: AIModelConfig[];
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedModelId, setSelectedModelIdState] = useState<string>(DEFAULT_MODEL_ID);

  useEffect(() => {
    const saved = localStorage.getItem("matchresume_selected_model");
    if (saved && AI_MODELS[saved]) {
      setSelectedModelIdState(saved);
    }
  }, []);

  const setSelectedModelId = (id: string) => {
    if (AI_MODELS[id]) {
      setSelectedModelIdState(id);
      localStorage.setItem("matchresume_selected_model", id);
    }
  };

  const selectedModel = AI_MODELS[selectedModelId] || AI_MODELS[DEFAULT_MODEL_ID];

  // Apply CSS variables dynamically to document and root
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--orb-core", selectedModel.colors.primary);
    root.style.setProperty("--orb-glow", selectedModel.colors.secondary);
    root.style.setProperty("--card-border", selectedModel.colors.borderGlow);
    root.style.setProperty("--dynamic-mesh", selectedModel.colors.meshGradient);
    root.style.setProperty("--scrollbar-thumb", selectedModel.colors.scrollbarThumb);
    root.style.setProperty("--scrollbar-thumb-hover", selectedModel.colors.scrollbarThumbHover);
    root.style.setProperty("--background", selectedModel.colors.bgColor);

    if (document.body) {
      document.body.style.backgroundColor = selectedModel.colors.bgColor;
      document.body.style.backgroundImage = selectedModel.colors.meshGradient;
    }
  }, [selectedModel]);

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        selectedModelId,
        setSelectedModelId,
        availableModels: Object.values(AI_MODELS),
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const context = useContext(ModelContext);
  if (!context) {
    throw new Error("useModel must be used within a ModelProvider");
  }
  return context;
}
