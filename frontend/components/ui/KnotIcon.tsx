"use client";

import React from "react";

interface KnotIconProps {
  className?: string;
  size?: number;
  color?: string;
}

export default function KnotIcon({ className = "h-5 w-5", size, color }: KnotIconProps) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={size ? { width: size, height: size } : undefined}
    >
      <defs>
        <linearGradient id="knot-dynamic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
          <stop offset="50%" stopColor="currentColor" stopOpacity="0.85" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.65" />
        </linearGradient>
      </defs>
      {/* Endless Interlocking Career Knot */}
      <path
        d="M16 6 C10 6, 6 10.5, 6 16 C6 21.5, 10 26, 16 26 C22 26, 26 21.5, 26 16 C26 10.5, 22 6, 16 6 Z"
        stroke={color || "url(#knot-dynamic-grad)"}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 9.5 L22.5 22.5 M22.5 9.5 L9.5 22.5"
        stroke={color || "url(#knot-dynamic-grad)"}
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <circle cx="16" cy="16" r="2" fill={color || "currentColor"} />
    </svg>
  );
}
