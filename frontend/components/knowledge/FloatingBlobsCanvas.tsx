"use client";

import React, { useState, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KnowledgeNode } from "@/lib/api/knowledge";
import { useModel } from "@/context/ModelContext";
import { Sparkles, Search, RefreshCw, Layers } from "lucide-react";

interface FloatingBlobsCanvasProps {
  nodes: KnowledgeNode[];
  onSelectNode: (node: KnowledgeNode) => void;
  selectedNodeId?: string | null;
}

// Deterministic organic blob border-radius generator based on string seed
function getOrganicBlobShape(seedStr: string, variant = 0): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i) + variant * 17;
    hash |= 0;
  }
  const p = (offset: number) => {
    const val = Math.abs(Math.sin(hash + offset) * 10000) % 1;
    return Math.floor(32 + val * 42); // between 32% and 74%
  };
  const r1 = p(1);
  const r2 = p(2);
  const r3 = p(3);
  const r4 = p(4);
  const r5 = p(5);
  const r6 = p(6);
  const r7 = p(7);
  const r8 = p(8);
  return `${r1}% ${100 - r1}% ${r2}% ${100 - r2}% / ${r3}% ${r4}% ${100 - r4}% ${100 - r3}%`;
}

interface StarNodePosition {
  x: number; // percentage 4% to 94%
  y: number; // percentage 5% to 92%
  size: number;
  shape1: string;
  shape2: string;
  floatDuration: number;
  floatDelay: number;
  driftX: number;
  driftY: number;
}

export default function FloatingBlobsCanvas({
  nodes,
  onSelectNode,
  selectedNodeId,
}: FloatingBlobsCanvasProps) {
  const { selectedModel } = useModel();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute organic scattered coordinates for each node (scattered like stars across deep space)
  const nodePositions = useMemo(() => {
    const posMap: Record<string, StarNodePosition> = {};
    const n = nodes.length;
    if (n === 0) return posMap;

    // Use golden ratio spiral / dispersed galaxy clustering
    nodes.forEach((node, i) => {
      // Golden angle distribution for starry natural scatter
      const angle = i * 2.39996; // golden angle in radians
      const radiusFraction = Math.sqrt((i + 1) / (n + 2)); // square root for uniform disk spread

      // Map to canvas bounds (with padding)
      const centerX = 50;
      const centerY = 50;
      const spreadX = 42; // percentage spread
      const spreadY = 40;

      // Add pseudo-random organic jitter so it never looks like a sterile grid or perfect spiral
      let seed = 0;
      for (let c = 0; c < node.id.length; c++) seed += node.id.charCodeAt(c);
      const jitterX = ((seed % 17) - 8) * 1.8;
      const jitterY = (((seed * 7) % 19) - 9) * 1.8;

      let x = centerX + Math.cos(angle) * (radiusFraction * spreadX) + jitterX;
      let y = centerY + Math.sin(angle) * (radiusFraction * spreadY) + jitterY;

      // Clamp safely inside canvas view
      x = Math.max(5, Math.min(92, x));
      y = Math.max(6, Math.min(90, y));

      // Determine organic size based on weight and category
      let baseSize = 75;
      if (node.category === "domains") baseSize = 145;
      else if (node.category === "projects") baseSize = 125;
      else if (node.category === "experience") baseSize = 115;
      else if (node.weight >= 75) baseSize = 92;
      else if (node.weight < 60) baseSize = 68;

      posMap[node.id] = {
        x,
        y,
        size: baseSize,
        shape1: getOrganicBlobShape(node.id, 1),
        shape2: getOrganicBlobShape(node.id, 2),
        floatDuration: 5 + (seed % 6) * 0.8,
        floatDelay: (seed % 9) * 0.4,
        driftX: ((seed % 7) - 3) * 3,
        driftY: (((seed * 3) % 9) - 4) * 3.5,
      };
    });

    return posMap;
  }, [nodes]);

  // Generate 60 ambient background stars
  const backgroundStars = useMemo(() => {
    return Array.from({ length: 65 }).map((_, i) => ({
      id: i,
      x: (i * 37) % 99,
      y: (i * 73) % 97,
      size: (i % 3 === 0 ? 3 : i % 2 === 0 ? 2 : 1),
      opacity: 0.2 + ((i * 13) % 80) / 100,
      blinkDuration: 2 + (i % 4) * 1.2,
      delay: (i % 5) * 0.6,
    }));
  }, []);

  const getNodePalette = (node: KnowledgeNode) => {
    switch (node.category) {
      case "skills":
        return {
          gradient: "from-emerald-400/35 via-teal-600/25 to-cyan-950/60",
          border: "rgba(52, 211, 153, 0.45)",
          glow: "rgba(16, 185, 129, 0.55)",
          text: "#a7f3d0",
          core: "#34d399",
        };
      case "projects":
        return {
          gradient: "from-cyan-400/35 via-blue-600/25 to-indigo-950/60",
          border: "rgba(56, 189, 248, 0.45)",
          glow: "rgba(6, 182, 212, 0.55)",
          text: "#bae6fd",
          core: "#38bdf8",
        };
      case "experience":
        return {
          gradient: "from-amber-400/35 via-orange-600/25 to-rose-950/60",
          border: "rgba(251, 191, 36, 0.45)",
          glow: "rgba(245, 158, 11, 0.55)",
          text: "#fde68a",
          core: "#fbbf24",
        };
      case "domains":
      default:
        return {
          gradient: "from-fuchsia-400/40 via-purple-600/30 to-indigo-950/65",
          border: "rgba(232, 121, 249, 0.5)",
          glow: "rgba(217, 70, 239, 0.6)",
          text: "#f5d0fe",
          core: "#e879f9",
        };
    }
  };

  // Find connections between nodes for faint glowing constellation lines
  const constellationLines = useMemo(() => {
    const lines: { x1: number; y1: number; x2: number; y2: number; color: string; id: string }[] = [];
    nodes.forEach((node) => {
      const p1 = nodePositions[node.id];
      if (!p1) return;
      if (node.related_nodes && node.related_nodes.length > 0) {
        node.related_nodes.slice(0, 3).forEach((relName) => {
          const targetNode = nodes.find((n) => n.name.toLowerCase() === relName.toLowerCase());
          if (targetNode && targetNode.id !== node.id) {
            const p2 = nodePositions[targetNode.id];
            if (p2) {
              const lineKey = [node.id, targetNode.id].sort().join("--");
              if (!lines.find((l) => l.id === lineKey)) {
                lines.push({
                  id: lineKey,
                  x1: p1.x,
                  y1: p1.y,
                  x2: p2.x,
                  y2: p2.y,
                  color: getNodePalette(node).core,
                });
              }
            }
          }
        });
      }
    });
    return lines;
  }, [nodes, nodePositions]);

  const activeHoveredNode = useMemo(() => {
    return nodes.find((n) => n.id === hoveredNodeId) || null;
  }, [nodes, hoveredNodeId]);

  return (
    <div className="relative w-full h-full min-h-[640px] rounded-3xl overflow-hidden bg-[#05060d] border border-white/10 shadow-2xl flex flex-col justify-between select-none">
      {/* Deep Space Background Ambient Glows */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#0c122a] via-[#05060d] to-[#020307] pointer-events-none" />

      {/* Atmospheric Nebulae */}
      <div
        className="absolute top-1/4 left-1/5 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none"
        style={{ background: selectedModel.colors.primary }}
      />
      <div className="absolute bottom-1/4 right-1/5 w-[450px] h-[450px] rounded-full blur-[140px] opacity-15 bg-cyan-500 pointer-events-none" />

      {/* Starfield Layer (Twinkling ambient dots) */}
      <div className="absolute inset-0 pointer-events-none">
        {backgroundStars.map((star) => (
          <motion.div
            key={star.id}
            animate={{ opacity: [star.opacity, star.opacity * 0.2, star.opacity] }}
            transition={{
              duration: star.blinkDuration,
              repeat: Infinity,
              delay: star.delay,
              ease: "easeInOut",
            }}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              boxShadow: star.size > 1 ? "0 0 6px rgba(255,255,255,0.8)" : "none",
            }}
          />
        ))}
      </div>

      {/* Subtle Constellation Connection Lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {constellationLines.map((line) => (
          <line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke={line.color}
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.18"
          />
        ))}
      </svg>

      {/* Floating Starry Control Pill (Minimalist, unobtrusive) */}
      <div className="absolute top-4 left-5 right-5 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto bg-black/60 backdrop-blur-xl px-3.5 py-1.5 rounded-full border border-white/10 shadow-lg">
          <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
          <span className="text-xs font-bold text-white tracking-wide">
            {nodes.length} Star Blobs
          </span>
          <span className="text-[10px] text-zinc-400 border-l border-white/10 pl-2">
            Click any star to enlarge
          </span>
        </div>

        {/* Search bar floating lightly */}
        <div className="relative pointer-events-auto w-48 sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search star cosmos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-full text-xs bg-black/60 backdrop-blur-xl border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50 shadow-lg transition-all"
          />
        </div>
      </div>

      {/* Scattered Organic Floating Blobs Stage */}
      <div className="relative w-full h-full flex-1 z-10 overflow-hidden">
        {nodes.map((node) => {
          const pos = nodePositions[node.id];
          if (!pos) return null;

          const palette = getNodePalette(node);
          const isHighlighted =
            searchQuery.trim() === "" ||
            node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (node.sub_category && node.sub_category.toLowerCase().includes(searchQuery.toLowerCase()));

          const isHovered = hoveredNodeId === node.id;

          return (
            <motion.div
              key={node.id}
              drag
              dragConstraints={{ left: -40, right: 40, top: -40, bottom: 40 }}
              dragElastic={0.15}
              animate={{
                x: [0, pos.driftX, -pos.driftX * 0.6, 0],
                y: [0, pos.driftY, -pos.driftY * 0.8, 0],
                borderRadius: [pos.shape1, pos.shape2, pos.shape1],
              }}
              transition={{
                duration: pos.floatDuration,
                repeat: Infinity,
                delay: pos.floatDelay,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.22, zIndex: 40 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => onSelectNode(node)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className={`absolute cursor-pointer flex flex-col items-center justify-center transition-opacity duration-300 ${
                isHighlighted ? "opacity-100" : "opacity-25"
              }`}
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${pos.size}px`,
                height: `${pos.size}px`,
                transform: "translate(-50%, -50%)",
                background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.22) 0%, transparent 60%), linear-gradient(135deg, ${palette.gradient})`,
                border: `1.5px solid ${palette.border}`,
                boxShadow: isHovered
                  ? `0 0 45px 12px ${palette.glow}, inset 0 0 20px rgba(255,255,255,0.3)`
                  : `0 0 25px 4px ${palette.glow}, inset 0 0 10px rgba(255,255,255,0.15)`,
                zIndex: isHovered ? 50 : Math.floor(pos.size),
              }}
            >
              {/* Inner ambient star core */}
              <div
                className="absolute w-2 h-2 rounded-full blur-[1px] opacity-75 top-2.5 right-3"
                style={{ background: palette.core }}
              />

              {/* Title inside blob */}
              <span className="font-extrabold text-[11px] sm:text-xs text-white tracking-tight text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2 leading-tight select-none">
                {node.name}
              </span>

              {/* Subtle category or percentage badge for larger nodes */}
              {pos.size >= 85 && (
                <span
                  className="mt-1 text-[9px] font-bold font-mono px-1.5 py-0.2 rounded-full opacity-80"
                  style={{
                    background: "rgba(0,0,0,0.4)",
                    color: palette.text,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  {node.weight}%
                </span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Floating Bottom Insight Bar when Hovering any Blob */}
      <AnimatePresence>
        {activeHoveredNode && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[90%] bg-black/80 backdrop-blur-2xl px-4 py-2.5 rounded-2xl border border-white/15 shadow-2xl flex items-center justify-between gap-4 pointer-events-none"
          >
            <div className="flex items-center gap-2.5 truncate">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
                style={{ background: getNodePalette(activeHoveredNode).core }}
              />
              <div className="truncate">
                <span className="font-black text-white text-xs mr-2">
                  {activeHoveredNode.name}
                </span>
                <span className="text-[11px] text-zinc-400 truncate">
                  {activeHoveredNode.highlight}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold text-cyan-400 shrink-0 uppercase tracking-wider">
              Click to Open &rarr;
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
