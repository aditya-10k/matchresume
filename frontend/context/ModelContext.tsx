"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { AI_MODELS, DEFAULT_MODEL_ID, AIModelConfig } from "@/lib/model-themes";

export type ColorMode = "dark" | "light";

interface ModelContextType {
  selectedModel: AIModelConfig;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  availableModels: AIModelConfig[];
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  isMounted: boolean;
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export function ModelProvider({ children }: { children: React.ReactNode }) {
  const [selectedModelId, setSelectedModelIdState] = useState<string>(DEFAULT_MODEL_ID);
  const [colorMode, setColorModeState] = useState<ColorMode>("dark");
  const [isMounted, setIsMounted] = useState<boolean>(false);

  useEffect(() => {
    setIsMounted(true);
    const savedModel = localStorage.getItem("matchresume_selected_model");
    if (savedModel && AI_MODELS[savedModel]) {
      setSelectedModelIdState(savedModel);
    }
    const savedColorMode = localStorage.getItem("matchresume_color_mode");
    if (savedColorMode === "light" || savedColorMode === "dark") {
      setColorModeState(savedColorMode);
    }
  }, []);

  const setSelectedModelId = (id: string) => {
    if (AI_MODELS[id]) {
      setSelectedModelIdState(id);
      localStorage.setItem("matchresume_selected_model", id);
    }
  };

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode);
    localStorage.setItem("matchresume_color_mode", mode);
  };

  const toggleColorMode = () => {
    setColorMode(colorMode === "dark" ? "light" : "dark");
  };

  const selectedModel = AI_MODELS[selectedModelId] || AI_MODELS[DEFAULT_MODEL_ID];

  // Apply CSS variables and class dynamically to document and root
  useEffect(() => {
    const root = document.documentElement;
    const isLight = colorMode === "light";

    if (isLight) {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }

    const currentBg = isLight ? selectedModel.colors.lightBgColor : selectedModel.colors.bgColor;
    const currentMesh = isLight ? selectedModel.colors.lightMeshGradient : selectedModel.colors.meshGradient;
    const currentForeground = isLight ? "#18181b" : "#f5ede8";
    const currentCardGlass = isLight ? "rgba(255, 255, 255, 0.85)" : "rgba(10, 5, 8, 0.72)";
    const currentCardGlassSubtle = isLight ? "rgba(255, 255, 255, 0.65)" : "rgba(12, 6, 9, 0.5)";
    const currentCardBorder = isLight ? `${selectedModel.colors.primary}28` : selectedModel.colors.borderGlow;
    const currentScrollbarTrack = isLight ? "#f4f4f5" : "#020204";

    root.style.setProperty("--orb-core", selectedModel.colors.primary);
    root.style.setProperty("--orb-glow", selectedModel.colors.secondary);
    root.style.setProperty("--card-glass", currentCardGlass);
    root.style.setProperty("--card-glass-subtle", currentCardGlassSubtle);
    root.style.setProperty("--card-border", currentCardBorder);
    root.style.setProperty("--dynamic-mesh", currentMesh);
    root.style.setProperty("--scrollbar-thumb", selectedModel.colors.scrollbarThumb);
    root.style.setProperty("--scrollbar-thumb-hover", selectedModel.colors.scrollbarThumbHover);
    root.style.setProperty("--scrollbar-track", currentScrollbarTrack);
    root.style.setProperty("--background", currentBg);
    root.style.setProperty("--foreground", currentForeground);

    if (document.body) {
      document.body.style.backgroundColor = currentBg;
      document.body.style.backgroundImage = currentMesh;
      document.body.style.color = currentForeground;
    }
  }, [selectedModel, colorMode]);

  return (
    <ModelContext.Provider
      value={{
        selectedModel,
        selectedModelId,
        setSelectedModelId,
        availableModels: Object.values(AI_MODELS),
        colorMode,
        setColorMode,
        toggleColorMode,
        isMounted,
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
