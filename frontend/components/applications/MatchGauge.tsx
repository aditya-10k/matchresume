"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useModel } from "@/context/ModelContext";

interface MatchGaugeProps {
  score: number;
  size?: number;
}

export default function MatchGauge({ score, size = 160 }: MatchGaugeProps) {
  const { selectedModel } = useModel();
  const [displayScore, setDisplayScore] = useState(0);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  useEffect(() => {
    let start = 0;
    const duration = 1200;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = score / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  return (
    <div
      className="relative flex items-center justify-center select-none"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-white/10"
        />

        {/* Animated colored progress stroke */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={selectedModel.colors.primary}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.4, ease: "easeOut" }}
          strokeLinecap="round"
          fill="transparent"
          style={{
            filter: `drop-shadow(0 0 12px ${selectedModel.colors.primary}80)`,
          }}
        />
      </svg>

      {/* Center percentage label */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          {displayScore}%
        </span>
        <span
          className="text-[10px] font-semibold uppercase tracking-wider"
          style={{ color: selectedModel.colors.primary }}
        >
          Match Fit
        </span>
      </div>
    </div>
  );
}
