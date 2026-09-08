export type ThemeMode = "orange" | "neon-pink" | "ultramarine";

export interface AIModelConfig {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  theme: ThemeMode;
  tagline: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    bgColor: string;
    lightBgColor: string;
    textAccent: string;
    orbGradient: string;
    orbSpecular: string;
    coronaGradient: string;
    haloBg: string;
    buttonGradient: string;
    buttonShadow: string;
    borderGlow: string;
    pillBg: string;
    pillBorder: string;
    pillText: string;
    meshGradient: string;
    lightMeshGradient: string;
    ringColor: string;
    scrollbarThumb: string;
    scrollbarThumbHover: string;
  };
}

export const AI_MODELS: Record<string, AIModelConfig> = {
  "openai/gpt-oss-120b": {
    id: "openai/gpt-oss-120b",
    name: "GPT OSS 120B",
    shortName: "GPT OSS 120B",
    provider: "OpenAI",
    theme: "orange",
    tagline: "High-reasoning semantic tailoring & LaTeX synthesis",
    colors: {
      primary: "#ff5c00",
      secondary: "#ff8c1a",
      accent: "#ffd080",
      bgColor: "#080402",
      lightBgColor: "#fcfbfa",
      textAccent: "from-orange-500 via-amber-500 to-orange-600",
      orbGradient:
        "radial-gradient(circle at 35% 30%, #ffcf70 0%, #ff8c1a 25%, #d94a00 55%, #7a1d00 80%, #290800 100%)",
      orbSpecular:
        "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(255, 230, 160, 0.5) 50%, transparent 100%)",
      coronaGradient: "from-orange-600 via-amber-500 to-yellow-400",
      haloBg: "rgba(255, 92, 0, 0.25)",
      buttonGradient: "from-amber-500 via-orange-500 to-orange-600",
      buttonShadow: "shadow-orange-600/40",
      borderGlow: "rgba(255, 92, 0, 0.2)",
      pillBg: "bg-orange-500/15",
      pillBorder: "border-orange-500/30",
      pillText: "text-orange-600 dark:text-orange-300",
      meshGradient:
        "radial-gradient(circle at 50% 15%, rgba(255, 92, 0, 0.24) 0%, rgba(180, 50, 0, 0.12) 40%, rgba(8, 4, 2, 0.98) 75%, #080402 100%), radial-gradient(circle at 85% 65%, rgba(255, 122, 26, 0.08) 0%, transparent 50%), radial-gradient(circle at 15% 75%, rgba(220, 60, 0, 0.06) 0%, transparent 45%)",
      lightMeshGradient:
        "radial-gradient(circle at 50% 12%, rgba(255, 92, 0, 0.14) 0%, rgba(255, 140, 26, 0.05) 45%, #fcfbfa 80%)",
      ringColor: "ring-orange-400/40",
      scrollbarThumb: "rgba(255, 92, 0, 0.45)",
      scrollbarThumbHover: "rgba(255, 92, 0, 0.8)",
    },
  },
  "meta-llama/llama-prompt-guard-2-22m": {
    id: "meta-llama/llama-prompt-guard-2-22m",
    name: "Llama Guard 2 22M",
    shortName: "Llama Guard 2",
    provider: "Meta",
    theme: "neon-pink",
    tagline: "Ultra-fast safety, factual alignment & hallucination defense",
    colors: {
      primary: "#ff007f",
      secondary: "#ff2a9d",
      accent: "#ff8fe0",
      bgColor: "#090206",
      lightBgColor: "#fdfbfa",
      textAccent: "from-pink-500 via-rose-500 to-fuchsia-600",
      orbGradient:
        "radial-gradient(circle at 35% 30%, #ffa3e3 0%, #ff1493 25%, #c70066 55%, #700039 80%, #290014 100%)",
      orbSpecular:
        "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(255, 180, 230, 0.5) 50%, transparent 100%)",
      coronaGradient: "from-pink-600 via-rose-500 to-fuchsia-400",
      haloBg: "rgba(255, 0, 127, 0.25)",
      buttonGradient: "from-fuchsia-500 via-pink-500 to-rose-600",
      buttonShadow: "shadow-pink-600/40",
      borderGlow: "rgba(255, 0, 127, 0.2)",
      pillBg: "bg-pink-500/15",
      pillBorder: "border-pink-500/30",
      pillText: "text-pink-600 dark:text-pink-300",
      meshGradient:
        "radial-gradient(circle at 50% 15%, rgba(255, 0, 127, 0.24) 0%, rgba(160, 0, 80, 0.12) 40%, rgba(9, 2, 6, 0.98) 75%, #090206 100%), radial-gradient(circle at 85% 65%, rgba(255, 20, 147, 0.08) 0%, transparent 50%), radial-gradient(circle at 15% 75%, rgba(200, 0, 100, 0.06) 0%, transparent 45%)",
      lightMeshGradient:
        "radial-gradient(circle at 50% 12%, rgba(255, 0, 127, 0.12) 0%, rgba(255, 42, 157, 0.04) 45%, #fdfbfa 80%)",
      ringColor: "ring-pink-400/40",
      scrollbarThumb: "rgba(255, 0, 127, 0.45)",
      scrollbarThumbHover: "rgba(255, 0, 127, 0.8)",
    },
  },
  "qwen/qwen3.6-27b": {
    id: "qwen/qwen3.6-27b",
    name: "Qwen 3.6 27B",
    shortName: "Qwen 3.6",
    provider: "Qwen",
    theme: "ultramarine",
    tagline: "Multi-lingual technical reasoning & precision code generation",
    colors: {
      primary: "#0055ff",
      secondary: "#2979ff",
      accent: "#80b3ff",
      bgColor: "#020308",
      lightBgColor: "#fafbff",
      textAccent: "from-blue-600 via-indigo-500 to-cyan-600",
      orbGradient:
        "radial-gradient(circle at 35% 30%, #90b8ff 0%, #0055ff 25%, #0036b3 55%, #001d66 80%, #000a26 100%)",
      orbSpecular:
        "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.95) 0%, rgba(180, 210, 255, 0.5) 50%, transparent 100%)",
      coronaGradient: "from-blue-600 via-indigo-500 to-cyan-400",
      haloBg: "rgba(0, 85, 255, 0.25)",
      buttonGradient: "from-cyan-500 via-blue-600 to-indigo-600",
      buttonShadow: "shadow-blue-600/40",
      borderGlow: "rgba(0, 85, 255, 0.2)",
      pillBg: "bg-blue-500/15",
      pillBorder: "border-blue-500/30",
      pillText: "text-blue-600 dark:text-blue-300",
      meshGradient:
        "radial-gradient(circle at 50% 15%, rgba(0, 85, 255, 0.25) 0%, rgba(0, 40, 160, 0.12) 40%, rgba(2, 3, 8, 0.98) 75%, #020308 100%), radial-gradient(circle at 85% 65%, rgba(41, 121, 255, 0.08) 0%, transparent 50%), radial-gradient(circle at 15% 75%, rgba(0, 60, 200, 0.06) 0%, transparent 45%)",
      lightMeshGradient:
        "radial-gradient(circle at 50% 12%, rgba(0, 85, 255, 0.12) 0%, rgba(41, 121, 255, 0.04) 45%, #fafbff 80%)",
      ringColor: "ring-blue-400/40",
      scrollbarThumb: "rgba(0, 85, 255, 0.45)",
      scrollbarThumbHover: "rgba(0, 85, 255, 0.8)",
    },
  },
};

export const DEFAULT_MODEL_ID = "qwen/qwen3.6-27b";
