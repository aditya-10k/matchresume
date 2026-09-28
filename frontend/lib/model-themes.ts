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

const THEME_PALETTES: Record<ThemeMode, AIModelConfig["colors"]> = {
  orange: {
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
  "neon-pink": {
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
  ultramarine: {
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
};

const THEME_ORDER: ThemeMode[] = ["orange", "neon-pink", "ultramarine"];

const DEFAULT_TAGLINES: Record<ThemeMode, string> = {
  orange: "High-reasoning semantic tailoring & LaTeX synthesis",
  "neon-pink": "Ultra-fast factual alignment & career intelligence",
  ultramarine: "Multi-lingual technical reasoning & precision code generation",
};

function inferProvider(modelId: string): string {
  const lower = modelId.toLowerCase();
  if (lower.includes("openai") || lower.includes("gpt")) return "OpenAI";
  if (lower.includes("llama") || lower.includes("meta")) return "Meta";
  if (lower.includes("qwen")) return "Qwen";
  if (lower.includes("deepseek")) return "DeepSeek";
  if (lower.includes("gemma") || lower.includes("gemini") || lower.includes("google")) return "Google";
  if (lower.includes("mixtral") || lower.includes("mistral")) return "Mistral";
  if (lower.includes("kimi") || lower.includes("moonshot")) return "Moonshot";
  if (modelId.includes("/")) {
    const prefix = modelId.split("/")[0];
    return prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  return "Groq";
}

export function buildModelConfig(modelId: string, index: number): AIModelConfig {
  const cleanId = modelId.trim();
  const theme = THEME_ORDER[index % THEME_ORDER.length];
  const shortName = cleanId.includes("/") ? cleanId.split("/").pop() || cleanId : cleanId;

  return {
    id: cleanId,
    name: cleanId,
    shortName,
    provider: inferProvider(cleanId),
    theme,
    tagline: DEFAULT_TAGLINES[theme],
    colors: THEME_PALETTES[theme],
  };
}

export function buildModelsMap(modelIds: string[]): Record<string, AIModelConfig> {
  const map: Record<string, AIModelConfig> = {};
  modelIds.forEach((id, idx) => {
    const clean = id.trim();
    if (clean) {
      map[clean] = buildModelConfig(clean, idx);
    }
  });
  return map;
}

function getInitialModelIdsFromEnv(): string[] {
  // 1. Check numbered NEXT_PUBLIC_MODEL_1, NEXT_PUBLIC_MODEL_2, NEXT_PUBLIC_MODEL_3
  const slot1 = process.env.NEXT_PUBLIC_MODEL_1 || process.env.NEXT_PUBLIC_GROQ_MODEL_1;
  const slot2 = process.env.NEXT_PUBLIC_MODEL_2 || process.env.NEXT_PUBLIC_GROQ_MODEL_2;
  const slot3 = process.env.NEXT_PUBLIC_MODEL_3 || process.env.NEXT_PUBLIC_GROQ_MODEL_3;
  const slots = [slot1, slot2, slot3].filter((s): s is string => Boolean(s && s.trim())).map((s) => s.trim());
  if (slots.length > 0) {
    return slots;
  }

  // 2. Check comma-separated NEXT_PUBLIC_PERMITTED_MODELS or NEXT_PUBLIC_GROQ_MODELS
  const rawList =
    process.env.NEXT_PUBLIC_PERMITTED_MODELS ||
    process.env.NEXT_PUBLIC_GROQ_MODELS ||
    "openai/gpt-oss-120b,llama-3.3-70b-versatile,qwen/qwen3-32b";

  const parsed = rawList
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  return parsed.length > 0 ? parsed : ["openai/gpt-oss-120b", "llama-3.3-70b-versatile", "qwen/qwen3-32b"];
}

const INITIAL_MODEL_IDS = getInitialModelIdsFromEnv();

export const AI_MODELS: Record<string, AIModelConfig> = buildModelsMap(INITIAL_MODEL_IDS);

export const DEFAULT_MODEL_ID = INITIAL_MODEL_IDS[0] || "openai/gpt-oss-120b";
