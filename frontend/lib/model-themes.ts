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
    ringColor: string;
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
      textAccent: "from-orange-400 via-amber-300 to-orange-500",
      orbGradient:
        "radial-gradient(circle at 35% 30%, #ffcf70 0%, #ff8c1a 25%, #d94a00 55%, #7a1d00 80%, #290800 100%)",
      orbSpecular:
        "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 230, 160, 0.4) 50%, transparent 100%)",
      coronaGradient: "from-orange-600 via-amber-500 to-yellow-400",
      haloBg: "rgba(255, 92, 0, 0.22)",
      buttonGradient: "from-amber-500 via-orange-500 to-orange-600",
      buttonShadow: "shadow-orange-600/40",
      borderGlow: "rgba(255, 92, 0, 0.2)",
      pillBg: "bg-orange-500/15",
      pillBorder: "border-orange-500/30",
      pillText: "text-orange-300",
      meshGradient:
        "radial-gradient(circle at 50% 15%, rgba(255, 92, 0, 0.22) 0%, rgba(200, 60, 0, 0.12) 35%, rgba(8, 4, 2, 0.95) 70%, #080402 100%)",
      ringColor: "ring-orange-400/40",
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
      textAccent: "from-pink-400 via-rose-300 to-fuchsia-500",
      orbGradient:
        "radial-gradient(circle at 35% 30%, #ff94db 0%, #ff1493 25%, #c70066 55%, #700039 80%, #290014 100%)",
      orbSpecular:
        "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 180, 230, 0.4) 50%, transparent 100%)",
      coronaGradient: "from-pink-600 via-rose-500 to-fuchsia-400",
      haloBg: "rgba(255, 0, 127, 0.22)",
      buttonGradient: "from-fuchsia-500 via-pink-500 to-rose-600",
      buttonShadow: "shadow-pink-600/40",
      borderGlow: "rgba(255, 0, 127, 0.2)",
      pillBg: "bg-pink-500/15",
      pillBorder: "border-pink-500/30",
      pillText: "text-pink-300",
      meshGradient:
        "radial-gradient(circle at 50% 15%, rgba(255, 0, 127, 0.2) 0%, rgba(180, 0, 90, 0.12) 35%, rgba(10, 3, 7, 0.95) 70%, #090206 100%)",
      ringColor: "ring-pink-400/40",
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
      primary: "#0047ff",
      secondary: "#2979ff",
      textAccent: "from-blue-400 via-cyan-300 to-indigo-500",
      orbGradient:
        "radial-gradient(circle at 35% 30%, #85b0ff 0%, #2962ff 25%, #0039cb 55%, #00227a 80%, #000c2e 100%)",
      orbSpecular:
        "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(180, 210, 255, 0.4) 50%, transparent 100%)",
      coronaGradient: "from-blue-600 via-indigo-500 to-cyan-400",
      haloBg: "rgba(0, 71, 255, 0.22)",
      buttonGradient: "from-cyan-500 via-blue-500 to-indigo-600",
      buttonShadow: "shadow-blue-600/40",
      borderGlow: "rgba(0, 71, 255, 0.2)",
      pillBg: "bg-blue-500/15",
      pillBorder: "border-blue-500/30",
      pillText: "text-blue-300",
      meshGradient:
        "radial-gradient(circle at 50% 15%, rgba(0, 71, 255, 0.2) 0%, rgba(0, 40, 180, 0.12) 35%, rgba(2, 4, 12, 0.95) 70%, #02040a 100%)",
      ringColor: "ring-blue-400/40",
    },
  },
};

export const DEFAULT_MODEL_ID = "openai/gpt-oss-120b";
