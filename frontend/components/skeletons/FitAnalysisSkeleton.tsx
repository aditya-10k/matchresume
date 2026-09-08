"use client";

import React from "react";
import { useModel } from "@/context/ModelContext";

export default function FitAnalysisSkeleton() {
  const { selectedModel } = useModel();

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 animate-pulse">
      {/* Dynamic Background Glow */}
      <div
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full -z-10 blur-3xl opacity-30"
        style={{
          background: `radial-gradient(circle, ${selectedModel.colors.primary} 0%, transparent 70%)`,
        }}
      />

      {/* Top Header Shimmer */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6 mb-8"
        style={{ borderColor: `${selectedModel.colors.primary}20` }}
      >
        <div className="flex items-center gap-4">
          <div className="h-9 w-9 rounded-xl bg-zinc-200 dark:bg-white/5" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-20 rounded-full"
                style={{ background: `${selectedModel.colors.primary}20` }}
              />
              <div className="h-3.5 w-28 rounded bg-zinc-200 dark:bg-white/10" />
            </div>
            <div className="h-6 w-64 rounded-lg bg-zinc-200 dark:bg-white/10" />
          </div>
        </div>

        {/* Action Button Shimmers */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-24 rounded-full bg-zinc-200 dark:bg-white/5" />
          <div
            className="h-9 w-36 rounded-full shadow-lg"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary}40 0%, ${selectedModel.colors.secondary}40 100%)`,
            }}
          />
        </div>
      </div>

      {/* Overview Grid (Match Gauge + Candidate Card) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
        {/* Left: Match Gauge Card Skeleton */}
        <div
          className="md:col-span-5 flex flex-col items-center justify-center rounded-3xl border bg-white/80 dark:bg-zinc-950/80 p-6 shadow-xl backdrop-blur-xl"
          style={{ borderColor: `${selectedModel.colors.primary}25` }}
        >
          <div className="h-3.5 w-32 rounded bg-zinc-200 dark:bg-white/10 mb-6" />

          {/* Circular Gauge Shimmer */}
          <div className="relative flex h-40 w-40 items-center justify-center mb-6">
            <div
              className="absolute inset-0 rounded-full border-4 border-dashed animate-spin"
              style={{
                borderColor: `${selectedModel.colors.primary}40 transparent transparent transparent`,
                animationDuration: "3s",
              }}
            />
            <div className="h-28 w-28 rounded-full bg-zinc-100 dark:bg-white/5 flex flex-col items-center justify-center space-y-1">
              <div
                className="h-7 w-14 rounded"
                style={{ background: `${selectedModel.colors.primary}30` }}
              />
              <div className="h-2.5 w-10 rounded bg-zinc-200 dark:bg-white/10" />
            </div>
          </div>

          <div className="h-5 w-28 rounded-full bg-emerald-500/20 mb-3" />
          <div className="space-y-1.5 w-full px-4">
            <div className="h-2.5 w-full rounded bg-zinc-200 dark:bg-white/5" />
            <div className="h-2.5 w-4/5 rounded bg-zinc-200 dark:bg-white/5 mx-auto" />
          </div>
        </div>

        {/* Right: Recommended Candidate Card Skeleton */}
        <div
          className="md:col-span-7 rounded-3xl border bg-white/80 dark:bg-zinc-950/80 p-6 shadow-xl backdrop-blur-xl flex flex-col justify-between"
          style={{ borderColor: `${selectedModel.colors.primary}25` }}
        >
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-white/10 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-xl bg-orange-500/20" />
                <div className="space-y-1">
                  <div className="h-2.5 w-24 rounded bg-zinc-200 dark:bg-white/10" />
                  <div className="h-4 w-44 rounded bg-zinc-300 dark:bg-white/20" />
                </div>
              </div>
              <div className="h-6 w-20 rounded-full bg-orange-500/20" />
            </div>

            {/* Strengths Shimmer */}
            <div className="mb-4">
              <div className="h-3 w-28 rounded bg-emerald-500/20 mb-2" />
              <div className="flex flex-wrap gap-1.5">
                <div className="h-5 w-24 rounded-full bg-emerald-500/10 border border-emerald-500/20" />
                <div className="h-5 w-32 rounded-full bg-emerald-500/10 border border-emerald-500/20" />
                <div className="h-5 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20" />
                <div className="h-5 w-28 rounded-full bg-emerald-500/10 border border-emerald-500/20" />
              </div>
            </div>

            {/* Gaps Shimmer */}
            <div className="mb-4">
              <div className="h-3 w-24 rounded bg-rose-500/20 mb-2" />
              <div className="flex flex-wrap gap-1.5">
                <div className="h-5 w-28 rounded-full bg-rose-500/10 border border-rose-500/20" />
                <div className="h-5 w-20 rounded-full bg-rose-500/10 border border-rose-500/20" />
                <div className="h-5 w-36 rounded-full bg-rose-500/10 border border-rose-500/20" />
              </div>
            </div>
          </div>

          {/* Reasoning Block */}
          <div className="rounded-2xl bg-zinc-100 dark:bg-white/5 p-4 space-y-2">
            <div className="h-2.5 w-full rounded bg-zinc-200 dark:bg-white/10" />
            <div className="h-2.5 w-11/12 rounded bg-zinc-200 dark:bg-white/10" />
            <div className="h-2.5 w-3/4 rounded bg-zinc-200 dark:bg-white/10" />
          </div>
        </div>
      </div>

      {/* Role Requirements Breakdown Skeleton */}
      <div
        className="rounded-3xl border bg-white/80 dark:bg-zinc-950/80 p-6 shadow-xl backdrop-blur-xl mb-8 space-y-6"
        style={{ borderColor: `${selectedModel.colors.primary}20` }}
      >
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-zinc-200 dark:bg-white/10" />
          <div className="h-4 w-48 rounded bg-zinc-200 dark:bg-white/10" />
        </div>

        {/* Required Skills Badges */}
        <div>
          <div className="h-3 w-28 rounded bg-zinc-200 dark:bg-white/10 mb-3" />
          <div className="flex flex-wrap gap-2">
            <div className="h-6 w-28 rounded-full bg-zinc-200 dark:bg-white/5" />
            <div className="h-6 w-36 rounded-full bg-zinc-200 dark:bg-white/5" />
            <div className="h-6 w-24 rounded-full bg-zinc-200 dark:bg-white/5" />
            <div className="h-6 w-40 rounded-full bg-zinc-200 dark:bg-white/5" />
            <div className="h-6 w-32 rounded-full bg-zinc-200 dark:bg-white/5" />
            <div className="h-6 w-20 rounded-full bg-zinc-200 dark:bg-white/5" />
          </div>
        </div>

        {/* Responsibilities Checklist */}
        <div className="space-y-2 pt-2">
          <div className="h-3 w-36 rounded bg-zinc-200 dark:bg-white/10 mb-2" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-3.5 w-3.5 rounded-full bg-zinc-200 dark:bg-white/10 shrink-0" />
              <div
                className="h-3 rounded bg-zinc-200 dark:bg-white/5"
                style={{ width: `${60 + (i * 9)}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Floating Ambient Status Pill */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
        <div
          className="flex items-center gap-3 rounded-full border px-5 py-2.5 shadow-2xl backdrop-blur-xl bg-black/80 text-white"
          style={{ borderColor: `${selectedModel.colors.primary}50` }}
        >
          <div
            className="h-2.5 w-2.5 rounded-full animate-ping"
            style={{ background: selectedModel.colors.primary }}
          />
          <span className="text-xs font-semibold">
            Evaluating candidate background & calculating match score...
          </span>
        </div>
      </div>
    </div>
  );
}
