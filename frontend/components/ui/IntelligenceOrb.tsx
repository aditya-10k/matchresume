"use client";

import { motion } from "framer-motion";

interface IntelligenceOrbProps {
  size?: "sm" | "md" | "lg" | "hero";
  status?: string;
  isProcessing?: boolean;
  onClick?: () => void;
}

export default function IntelligenceOrb({
  size = "hero",
  status = "Aira is ready...",
  isProcessing = false,
  onClick,
}: IntelligenceOrbProps) {
  const sizeMap = {
    sm: "w-20 h-20",
    md: "w-36 h-36",
    lg: "w-52 h-52",
    hero: "w-60 h-60 sm:w-72 sm:h-72",
  };

  return (
    <div className="flex flex-col items-center justify-center select-none">
      {/* Outer ambient radiant halo */}
      <div className="relative flex items-center justify-center">
        <motion.div
          animate={{
            scale: isProcessing ? [1, 1.15, 1] : [1, 1.05, 1],
            opacity: isProcessing ? [0.4, 0.7, 0.4] : [0.35, 0.5, 0.35],
          }}
          transition={{
            duration: isProcessing ? 2 : 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute rounded-full bg-gradient-to-tr from-orange-600 via-amber-500 to-yellow-400 blur-3xl ${sizeMap[size]}`}
          style={{ transform: "scale(1.35)" }}
        />

        {/* Secondary warm dusk diffuse aura */}
        <div
          className={`absolute rounded-full bg-orange-600/25 blur-2xl ${sizeMap[size]}`}
          style={{ transform: "scale(1.15)" }}
        />

        {/* The 3D Rendered Sphere */}
        <motion.div
          onClick={onClick}
          animate={{
            y: [0, -6, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className={`relative rounded-full cursor-pointer shadow-2xl transition-all ${sizeMap[size]}`}
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #ffcf70 0%, #ff8c1a 25%, #d94a00 55%, #7a1d00 80%, #290800 100%)",
            boxShadow:
              "inset -12px -16px 28px rgba(20, 4, 0, 0.85), inset 8px 10px 18px rgba(255, 235, 175, 0.6), 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 70px rgba(255, 92, 0, 0.45)",
          }}
        >
          {/* Specular Glint / Highlight */}
          <div
            className="absolute top-4 left-6 w-14 h-10 rounded-full blur-[1px] opacity-75 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, rgba(255, 255, 255, 0.9) 0%, rgba(255, 230, 160, 0.4) 50%, transparent 100%)",
              transform: "rotate(-25deg)",
            }}
          />

          {/* Core Energy Ring Ripple during processing */}
          {isProcessing && (
            <motion.div
              animate={{
                scale: [1, 1.4],
                opacity: [0.8, 0],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeOut",
              }}
              className="absolute inset-0 rounded-full border-2 border-amber-300 pointer-events-none"
            />
          )}
        </motion.div>
      </div>

      {/* Subtitle / Status Text */}
      {status && (
        <motion.p
          animate={{ opacity: isProcessing ? [0.6, 1, 0.6] : 0.8 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-6 text-xs sm:text-sm font-medium tracking-wide text-orange-200/70"
        >
          {status}
        </motion.p>
      )}
    </div>
  );
}
