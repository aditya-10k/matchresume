"use client";

import React from "react";
import { stripAsterisks } from "@/lib/utils";

interface CleanAIResponseProps {
  content: string | null | undefined;
  className?: string;
  dotColor?: string;
}

export default function CleanAIResponse({
  content,
  className = "",
  dotColor = "bg-cyan-400",
}: CleanAIResponseProps) {
  if (!content) return null;

  // 1. Remove all asterisks from the text
  const sanitized = stripAsterisks(content);
  const lines = sanitized.split("\n");

  return (
    <div className={`space-y-1 ${className}`}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        if (!trimmed) {
          return <div key={idx} className="h-2" />;
        }

        // Heading 3 or 2 (### Heading or ## Heading)
        if (trimmed.startsWith("###") || trimmed.startsWith("##") || trimmed.startsWith("#")) {
          const headingText = trimmed.replace(/^#+\s*/, "");
          return (
            <div
              key={idx}
              className="text-xs sm:text-sm font-bold text-white tracking-wide pt-3 pb-1 border-b border-white/5"
            >
              {headingText}
            </div>
          );
        }

        // Bullet point line (- item or • item)
        if (trimmed.startsWith("-") || trimmed.startsWith("•")) {
          const bulletText = trimmed.replace(/^[-•]\s*/, "");
          return (
            <div key={idx} className="flex items-start gap-2.5 py-0.5 text-zinc-200">
              <span
                className={`h-1.5 w-1.5 rounded-full mt-2 shrink-0 ${dotColor}`}
              />
              <span className="text-xs sm:text-sm leading-relaxed">
                {bulletText}
              </span>
            </div>
          );
        }

        // Regular paragraph line
        return (
          <p key={idx} className="text-xs sm:text-sm leading-relaxed text-zinc-200 py-0.5">
            {line}
          </p>
        );
      })}
    </div>
  );
}
