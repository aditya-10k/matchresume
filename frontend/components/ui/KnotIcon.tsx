"use client";

import React from "react";
import { useModel } from "@/context/ModelContext";

interface KnotIconProps {
  className?: string;
  size?: number;
  mode?: "light" | "dark" | "auto";
  alt?: string;
}

export default function KnotIcon({
  className = "h-5 w-5",
  size,
  mode = "auto",
  alt = "matchresume knot",
}: KnotIconProps) {
  const { colorMode, isMounted } = useModel();

  // In auto mode, use black knot for light mode and white knot for dark mode
  const isLight = mode === "light" || (mode === "auto" && isMounted && colorMode === "light");
  const src = isLight ? "/brand-black.png" : "/brand-white.png";

  return (
    <span
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={size ? { width: size, height: size } : undefined}
    >
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-contain pointer-events-none"
        loading="eager"
        decoding="async"
      />
    </span>
  );
}
