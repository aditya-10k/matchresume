"use client";

import React from "react";
import { useModel } from "@/context/ModelContext";

export default function LatexStudioSkeleton() {
  const { selectedModel } = useModel();

  return (
    <div className="relative mx-auto flex h-[calc(100vh-2rem)] max-w-7xl flex-col px-4 sm:px-6 lg:px-8 animate-pulse overflow-hidden">
      {/* Dynamic Ambient Background Glow */}
      <div
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full -z-10 blur-3xl opacity-30"
        style={{
          background: `radial-gradient(circle, ${selectedModel.colors.primary} 0%, transparent 70%)`,
        }}
      />

      {/* Top Studio Control Bar Shimmer */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b py-3 mb-4"
        style={{ borderColor: `${selectedModel.colors.primary}20` }}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-xl bg-zinc-200 dark:bg-white/10" />
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-20 rounded-full"
                style={{ background: `${selectedModel.colors.primary}25` }}
              />
              <div className="h-3.5 w-24 rounded bg-zinc-200 dark:bg-white/10" />
            </div>
            <div className="h-5 w-48 rounded bg-zinc-300 dark:bg-white/20" />
          </div>
        </div>

        {/* Action Button Shimmers */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-24 rounded-full bg-zinc-200 dark:bg-white/5" />
          <div className="h-8 w-24 rounded-full bg-zinc-200 dark:bg-white/5" />
          <div className="h-8 w-24 rounded-full bg-zinc-200 dark:bg-white/5" />
          <div
            className="h-8 w-32 rounded-full shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary}40 0%, ${selectedModel.colors.secondary}40 100%)`,
            }}
          />
        </div>
      </div>

      {/* Split-Pane Workspace */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4 min-h-0 overflow-hidden">
        {/* Left Pane: Code Editor Skeleton */}
        <div
          className="flex h-full flex-col rounded-3xl border bg-zinc-950/90 shadow-2xl backdrop-blur-2xl overflow-hidden"
          style={{ borderColor: `${selectedModel.colors.primary}30` }}
        >
          {/* Editor Header Bar */}
          <div
            className="flex items-center justify-between border-b px-4 py-2.5 bg-black/60"
            style={{ borderColor: `${selectedModel.colors.primary}20` }}
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-zinc-700" />
              <div className="h-3.5 w-24 rounded bg-zinc-700" />
              <div className="h-3 w-16 rounded bg-zinc-800" />
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-16 rounded-full bg-zinc-800" />
              <div className="h-6 w-16 rounded-full bg-zinc-800" />
            </div>
          </div>

          {/* Gutter + Code Lines Shimmer */}
          <div className="flex-1 overflow-hidden p-4 font-mono text-xs flex gap-4 bg-zinc-950">
            {/* Gutter */}
            <div className="space-y-2 select-none text-zinc-600 border-r border-zinc-800 pr-3">
              {Array.from({ length: 22 }).map((_, i) => (
                <div key={i} className="text-right text-[11px] leading-5">
                  {i + 1}
                </div>
              ))}
            </div>

            {/* Code Lines */}
            <div className="flex-1 space-y-2 pt-0.5">
              <div className="h-3.5 w-3/5 rounded bg-blue-500/20" />
              <div className="h-3.5 w-4/5 rounded bg-indigo-500/20" />
              <div className="h-3.5 w-2/5 rounded bg-indigo-500/20" />
              <div className="h-3.5 w-1/2 rounded bg-indigo-500/20" />
              <div className="h-3 w-0" />
              <div className="h-3.5 w-2/3 rounded bg-amber-500/20" />
              <div className="h-3.5 w-1/3 rounded bg-zinc-700/50 pl-4" />
              <div className="h-3.5 w-1/2 rounded bg-zinc-700/50 pl-4" />
              <div className="h-3 w-0" />
              <div className="h-3.5 w-2/5 rounded bg-emerald-500/20" />
              <div className="h-3.5 w-3/4 rounded bg-zinc-700/40 pl-4" />
              <div className="h-3.5 w-5/6 rounded bg-zinc-700/40 pl-4" />
              <div className="h-3 w-0" />
              <div className="h-3.5 w-1/2 rounded bg-emerald-500/20" />
              <div className="h-3.5 w-4/5 rounded bg-zinc-700/40 pl-4" />
              <div className="h-3.5 w-3/4 rounded bg-zinc-700/40 pl-4" />
              <div className="h-3.5 w-2/3 rounded bg-zinc-700/40 pl-4" />
              <div className="h-3 w-0" />
              <div className="h-3.5 w-2/5 rounded bg-emerald-500/20" />
              <div className="h-3.5 w-5/6 rounded bg-zinc-700/40 pl-4" />
              <div className="h-3.5 w-4/5 rounded bg-zinc-700/40 pl-4" />
              <div className="h-3.5 w-1/4 rounded bg-blue-500/20" />
            </div>
          </div>

          {/* Editor Status Bar */}
          <div
            className="flex items-center justify-between border-t px-4 py-2 bg-black/60 text-[11px]"
            style={{ borderColor: `${selectedModel.colors.primary}20` }}
          >
            <div className="flex items-center gap-2">
              <div
                className="h-2 w-2 rounded-full animate-ping"
                style={{ background: selectedModel.colors.primary }}
              />
              <div className="h-3 w-36 rounded bg-zinc-700" />
            </div>
            <div className="h-3 w-28 rounded bg-zinc-800" />
          </div>
        </div>

        {/* Right Pane: A4 Paper Live Preview Canvas Skeleton */}
        <div
          className="flex h-full flex-col rounded-3xl border bg-white/95 dark:bg-zinc-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden"
          style={{ borderColor: `${selectedModel.colors.primary}30` }}
        >
          {/* Preview Header Bar */}
          <div
            className="flex items-center justify-between border-b px-5 py-3 bg-zinc-50/80 dark:bg-black/50"
            style={{ borderColor: `${selectedModel.colors.primary}20` }}
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded bg-zinc-300 dark:bg-zinc-700" />
              <div className="h-3.5 w-36 rounded bg-zinc-300 dark:bg-zinc-700" />
              <div className="h-3.5 w-24 rounded-full bg-emerald-500/20" />
            </div>
            <div className="h-7 w-28 rounded-full bg-zinc-300 dark:bg-white/10" />
          </div>

          {/* A4 Sheet Preview Container */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-zinc-100/70 dark:bg-black/60 flex justify-center">
            <div className="w-full max-w-[780px] bg-white text-zinc-900 shadow-2xl rounded-sm p-8 sm:p-12 min-h-[900px] space-y-6">
              {/* Header: Name & Contacts */}
              <div className="text-center space-y-3 pb-4 border-b border-zinc-200">
                <div className="h-7 w-52 rounded bg-zinc-800 mx-auto" />
                <div className="flex justify-center gap-2">
                  <div className="h-3 w-24 rounded bg-zinc-400" />
                  <div className="h-3 w-36 rounded bg-zinc-400" />
                  <div className="h-3 w-28 rounded bg-zinc-400" />
                </div>
              </div>

              {/* Section 1: Education */}
              <div className="space-y-2">
                <div className="h-4 w-32 rounded bg-zinc-800 border-b-2 border-zinc-800 pb-1" />
                <div className="flex justify-between items-baseline pt-1">
                  <div className="h-3.5 w-64 rounded bg-zinc-700" />
                  <div className="h-3 w-20 rounded bg-zinc-500" />
                </div>
                <div className="h-3 w-72 rounded bg-zinc-500" />
              </div>

              {/* Section 2: Technical Skills */}
              <div className="space-y-2 pt-2">
                <div className="h-4 w-36 rounded bg-zinc-800 border-b-2 border-zinc-800 pb-1" />
                <div className="h-3 w-full rounded bg-zinc-600" />
                <div className="h-3 w-11/12 rounded bg-zinc-600" />
                <div className="h-3 w-4/5 rounded bg-zinc-600" />
              </div>

              {/* Section 3: Professional Experience */}
              <div className="space-y-2 pt-2">
                <div className="h-4 w-44 rounded bg-zinc-800 border-b-2 border-zinc-800 pb-1" />
                <div className="flex justify-between items-baseline pt-1">
                  <div className="h-3.5 w-48 rounded bg-zinc-700" />
                  <div className="h-3 w-24 rounded bg-zinc-500" />
                </div>
                <div className="h-3 w-32 rounded bg-zinc-500" />
                <div className="space-y-1.5 pl-4 pt-1">
                  <div className="h-2.5 w-full rounded bg-zinc-500" />
                  <div className="h-2.5 w-11/12 rounded bg-zinc-500" />
                  <div className="h-2.5 w-4/5 rounded bg-zinc-500" />
                </div>
              </div>

              {/* Section 4: Projects */}
              <div className="space-y-2 pt-2">
                <div className="h-4 w-28 rounded bg-zinc-800 border-b-2 border-zinc-800 pb-1" />
                <div className="flex justify-between items-baseline pt-1">
                  <div className="h-3.5 w-40 rounded bg-zinc-700" />
                  <div className="h-3 w-16 rounded bg-zinc-500" />
                </div>
                <div className="space-y-1.5 pl-4 pt-1">
                  <div className="h-2.5 w-full rounded bg-zinc-500" />
                  <div className="h-2.5 w-5/6 rounded bg-zinc-500" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Ambient Status Pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div
          className="flex items-center gap-3 rounded-full border px-5 py-2.5 shadow-2xl backdrop-blur-xl bg-black/85 text-white"
          style={{ borderColor: `${selectedModel.colors.primary}50` }}
        >
          <div
            className="h-2.5 w-2.5 rounded-full animate-ping"
            style={{ background: selectedModel.colors.primary }}
          />
          <span className="text-xs font-semibold">
            Resume Writer Agent Synthesizing LaTeX with {selectedModel.name}...
          </span>
        </div>
      </div>
    </div>
  );
}
