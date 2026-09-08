"use client";

import { useState, useRef, MouseEvent } from "react";
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useModel } from "@/context/ModelContext";
import { Mic, Volume2, Sparkles } from "lucide-react";

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
  const [isListening, setIsListening] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const orbRef = useRef<HTMLDivElement>(null);

  // 3D Tilt Physics using Framer Motion Springs
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 18, stiffness: 180 };
  const rotateX = useSpring(useTransform(mouseY, [-100, 100], [18, -18]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-100, 100], [-18, 18]), springConfig);

  // Dynamic light glint offset tracking cursor
  const glintX = useSpring(useTransform(mouseX, [-100, 100], [-10, 18]), springConfig);
  const glintY = useSpring(useTransform(mouseY, [-100, 100], [-8, 16]), springConfig);

  const sizeMap = {
    sm: "w-20 h-20",
    md: "w-36 h-36",
    lg: "w-52 h-52",
    hero: "w-60 h-60 sm:w-72 sm:h-72",
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!orbRef.current) return;
    const rect = orbRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    mouseX.set(e.clientX - centerX);
    mouseY.set(e.clientY - centerY);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  const handleOrbClick = () => {
    setIsListening((prev) => !prev);
    setRippleKey((prev) => prev + 1);
    if (onClick) onClick();
  };

  const activeStatus = isListening
    ? `${selectedModel.shortName} is listening...`
    : isProcessing
    ? `${selectedModel.shortName} is synthesizing...`
    : status || `${selectedModel.name} core ready`;

  return (
    <div
      ref={orbRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="flex flex-col items-center justify-center select-none perspective-1000 cursor-grab active:cursor-grabbing"
    >
      <div className="relative flex items-center justify-center">
        {/* Outward Radiating Soundwaves / Energy Rings on Click */}
        <AnimatePresence>
          {isListening && (
            <>
              {[1, 2, 3].map((ring) => (
                <motion.div
                  key={`${rippleKey}-ring-${ring}`}
                  initial={{ scale: 0.9, opacity: 0.8 }}
                  animate={{
                    scale: [0.95, 1.35 + ring * 0.25],
                    opacity: [0.7, 0],
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: ring * 0.45,
                    ease: "easeOut",
                  }}
                  className="absolute rounded-full border pointer-events-none"
                  style={{
                    width: "100%",
                    height: "100%",
                    borderColor: `${selectedModel.colors.primary}70`,
                    boxShadow: `0 0 20px ${selectedModel.colors.primary}40`,
                  }}
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Ambient Outer Halo with Dynamic Model Glow */}
        <motion.div
          animate={{
            scale: isListening ? [1.1, 1.25, 1.1] : [1, 1.06, 1],
            opacity: isListening ? [0.6, 0.9, 0.6] : [0.4, 0.65, 0.4],
          }}
          transition={{
            duration: isListening ? 1.8 : 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className={`absolute rounded-full blur-3xl transition-colors duration-700 pointer-events-none ${sizeMap[size]}`}
          style={{
            background: `radial-gradient(circle, ${selectedModel.colors.primary}90 0%, ${selectedModel.colors.secondary}40 50%, transparent 80%)`,
            transform: "scale(1.4)",
          }}
        />

        {/* Secondary diffuse aura */}
        <motion.div
          className={`absolute rounded-full blur-2xl transition-colors duration-700 pointer-events-none ${sizeMap[size]}`}
          style={{
            background: `${selectedModel.colors.primary}35`,
            transform: "scale(1.18)",
          }}
        />

        {/* Interactive 3D Physics Sphere */}
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            background: selectedModel.colors.orbGradient,
            boxShadow: `inset -14px -18px 32px rgba(0, 0, 0, 0.88), inset 10px 12px 22px rgba(255, 255, 255, 0.5), 0 24px 60px rgba(0, 0, 0, 0.85), 0 0 80px ${selectedModel.colors.primary}50`,
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.93 }}
          drag
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          dragElastic={0.25}
          onClick={handleOrbClick}
          className={`relative rounded-full shadow-2xl transition-colors duration-700 ${sizeMap[size]}`}
        >
          {/* Dynamic Specular Light Glint (moves with 3D cursor tilt) */}
          <motion.div
            style={{
              x: glintX,
              y: glintY,
              background: selectedModel.colors.orbSpecular,
              transform: "rotate(-25deg)",
            }}
            className="absolute top-4 left-6 w-16 h-11 rounded-full blur-[1px] opacity-80 pointer-events-none transition-colors duration-700"
          />

          {/* Secondary subtle rim light reflection */}
          <div
            className="absolute bottom-5 right-7 w-12 h-6 rounded-full blur-sm opacity-35 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse, ${selectedModel.colors.accent} 0%, transparent 80%)`,
            }}
          />

          {/* Center Voice/Frequency Indicator Icon when Listening */}
          <AnimatePresence>
            {isListening && (
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 shadow-lg">
                  {[0.4, 0.8, 1, 0.7, 0.3].map((height, i) => (
                    <motion.span
                      key={i}
                      animate={{
                        scaleY: [height, 1.6, height],
                      }}
                      transition={{
                        duration: 0.6 + i * 0.1,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="w-1 bg-white rounded-full"
                      style={{ height: "14px", originY: 0.5 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Interactive Status & Hint */}
      <div className="mt-6 flex flex-col items-center gap-1">
        <motion.p
          animate={{ opacity: isListening ? [0.7, 1, 0.7] : 0.9 }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-xs sm:text-sm font-medium tracking-wide transition-colors duration-500"
          style={{ color: selectedModel.colors.primary }}
        >
          {activeStatus}
        </motion.p>
        <span className="text-[10px] text-zinc-500 tracking-tight flex items-center gap-1">
          <Sparkles className="h-2.5 w-2.5" style={{ color: selectedModel.colors.primary }} />
          <span>Interactive Core • Drag, tilt or tap to pulse</span>
        </span>
      </div>
    </div>
  );
}
