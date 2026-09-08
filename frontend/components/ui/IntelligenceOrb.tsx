"use client";

import { motion } from "framer-motion";
import { useModel } from "@/context/ModelContext";

interface IntelligenceOrbProps {
  size?: "sm" | "md" | "lg" | "hero";
  status?: string;
  isProcessing?: boolean;
  onClick?: () => void;
}

export default function IntelligenceOrb({
  size = "hero",
  status,
  isProcessing = false,
  onClick,
}: IntelligenceOrbProps) {
  const { selectedModel } = useModel();

  const sizeMap = {
    sm: "w-20 h-20",
    md: "w-36 h-36",
    lg: "w-52 h-52",
    hero: "w-60 h-60 sm:w-72 sm:h-72",
  };

  const currentStatus = status || `${selectedModel.name} core active`;

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
          className={`absolute rounded-full blur-3xl transition-colors duration-700 ${sizeMap[size]}`}
          style={{
            background: `radial-gradient(circle, ${selectedModel.colors.primary}80 0%, ${selectedModel.colors.secondary}40 50%, transparent 80%)`,
            transform: "scale(1.4)",
          }}
        />

        {/* Secondary diffuse aura */}
        <motion.div
          className={`absolute rounded-full blur-2xl transition-colors duration-700 ${sizeMap[size]}`}
          style={{
            background: `${selectedModel.colors.primary}30`,
            transform: "scale(1.15)",
          }}
        />

        {/* The 3D Rendered Dynamic Sphere */}
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
          className={`relative rounded-full cursor-pointer shadow-2xl transition-all duration-700 ${sizeMap[size]}`}
          style={{
            background: selectedModel.colors.orbGradient,
            boxShadow: `inset -12px -16px 28px rgba(0, 0, 0, 0.85), inset 8px 10px 18px rgba(255, 255, 255, 0.45), 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 70px ${selectedModel.colors.primary}45`,
          }}
        >
          {/* Specular Glint / Highlight */}
          <div
            className="absolute top-4 left-6 w-14 h-10 rounded-full blur-[1px] opacity-75 pointer-events-none transition-all duration-700"
            style={{
              background: selectedModel.colors.orbSpecular,
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
              className="absolute inset-0 rounded-full border-2 pointer-events-none"
              style={{ borderColor: selectedModel.colors.secondary }}
            />
          )}
        </motion.div>
      </div>

      {/* Subtitle / Status Text */}
      {currentStatus && (
        <motion.p
          animate={{ opacity: isProcessing ? [0.6, 1, 0.6] : 0.85 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mt-6 text-xs sm:text-sm font-medium tracking-wide transition-colors duration-500"
          style={{ color: `${selectedModel.colors.primary}dd` }}
        >
          {currentStatus}
        </motion.p>
      )}
    </div>
  );
}
