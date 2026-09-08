"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { KnowledgeNode } from "@/lib/api/knowledge";
import { useModel } from "@/context/ModelContext";
import { Search } from "lucide-react";

interface FloatingBlobsCanvasProps {
  nodes: KnowledgeNode[];
  onSelectNode: (node: KnowledgeNode) => void;
  selectedNodeId?: string | null;
}

// Deterministic organic blob border-radius generator based on seed
function getOrganicBlobShape(seedStr: string): string {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  const p = (offset: number) => {
    const val = Math.abs(Math.sin(hash + offset) * 10000) % 1;
    return Math.floor(30 + val * 45); // between 30% and 75%
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
  x: number; // percentage across full screen
  y: number; // percentage across full screen
  size: number;
  shape: string;
  shineDuration: number;
  shineDelay: number;
}

export default function FloatingBlobsCanvas({
  nodes,
  onSelectNode,
  selectedNodeId,
}: FloatingBlobsCanvasProps) {
  const { selectedModel } = useModel();
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Compute organic scattered coordinates covering the WHOLE screen with repulsion
  const nodePositions = useMemo(() => {
    const posMap: Record<string, StarNodePosition> = {};
    const count = nodes.length;
    if (count === 0) return posMap;

    // Grid-seed distribution across full canvas width and height
    const points: { x: number; y: number; id: string; size: number }[] = [];
    const cols = Math.ceil(Math.sqrt(count * 1.8));
    const rows = Math.ceil(count / cols);

    nodes.forEach((node, i) => {
      let seed = 0;
      for (let c = 0; c < node.id.length; c++) seed += node.id.charCodeAt(c);

      const col = i % cols;
      const row = Math.floor(i / cols);

      // Distribute from 5% to 94% horizontally, and 6% to 92% vertically
      const baseCellX = 6 + (col / (cols - 1 || 1)) * 86;
      const baseCellY = 7 + (row / (rows - 1 || 1)) * 84;

      const jitterX = (((seed * 13) % 23) - 11) * 1.6;
      const jitterY = (((seed * 29) % 23) - 11) * 1.6;

      let x = baseCellX + jitterX;
      let y = baseCellY + jitterY;

      x = Math.max(5, Math.min(94, x));
      y = Math.max(6, Math.min(93, y));

      let baseSize = 80;
      if (node.category === "domains") baseSize = 135;
      else if (node.category === "projects") baseSize = 115;
      else if (node.category === "experience") baseSize = 105;
      else if (node.weight >= 80) baseSize = 92;
      else if (node.weight < 60) baseSize = 72;

      points.push({ x, y, id: node.id, size: baseSize });
    });

    // Pairwise repulsion relaxation to guarantee wide dispersion across the sky
    const iterations = 40;
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const dist = Math.sqrt((dx * 1.6) * (dx * 1.6) + dy * dy);
          const minDist = ((points[i].size + points[j].size) / 2) * 0.15;

          if (dist < minDist && dist > 0.001) {
            const overlap = (minDist - dist) / dist;
            const force = overlap * 0.38;
            points[i].x += dx * force;
            points[i].y += dy * force;
            points[j].x -= dx * force;
            points[j].y -= dy * force;

            points[i].x = Math.max(5, Math.min(94, points[i].x));
            points[i].y = Math.max(6, Math.min(93, points[i].y));
            points[j].x = Math.max(5, Math.min(94, points[j].x));
            points[j].y = Math.max(6, Math.min(93, points[j].y));
          }
        }
      }
    }

    points.forEach((p) => {
      let seed = 0;
      for (let c = 0; c < p.id.length; c++) seed += p.id.charCodeAt(c);
      posMap[p.id] = {
        x: p.x,
        y: p.y,
        size: p.size,
        shape: getOrganicBlobShape(p.id),
        shineDuration: 2.8 + (seed % 5) * 0.7,
        shineDelay: (seed % 7) * 0.4,
      };
    });

    return posMap;
  }, [nodes]);

  // Ambient stars in background
  const backgroundStars = useMemo(() => {
    return Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      x: (i * 37) % 99,
      y: (i * 73) % 98,
      size: i % 4 === 0 ? 2.5 : i % 2 === 0 ? 1.8 : 1,
      opacity: 0.15 + ((i * 17) % 75) / 100,
      blinkDuration: 2.5 + (i % 4) * 1.2,
      delay: (i % 6) * 0.5,
    }));
  }, []);

  const getNodePalette = (node: KnowledgeNode) => {
    switch (node.category) {
      case "skills":
        return {
          gradient: "rgba(52, 211, 153, 0.35) 0%, rgba(13, 148, 136, 0.22) 50%, rgba(6, 78, 59, 0.65) 100%",
          border: "rgba(52, 211, 153, 0.45)",
          glow: "rgba(16, 185, 129, 0.55)",
          text: "#a7f3d0",
          core: "#34d399",
        };
      case "projects":
        return {
          gradient: "rgba(56, 189, 248, 0.35) 0%, rgba(37, 99, 235, 0.22) 50%, rgba(30, 27, 75, 0.65) 100%",
          border: "rgba(56, 189, 248, 0.45)",
          glow: "rgba(6, 182, 212, 0.55)",
          text: "#bae6fd",
          core: "#38bdf8",
        };
      case "experience":
        return {
          gradient: "rgba(251, 191, 36, 0.35) 0%, rgba(234, 88, 12, 0.22) 50%, rgba(76, 5, 25, 0.65) 100%",
          border: "rgba(251, 191, 36, 0.45)",
          glow: "rgba(245, 158, 11, 0.55)",
          text: "#fde68a",
          core: "#fbbf24",
        };
      case "domains":
      default:
        return {
          gradient: `${selectedModel.colors.primary}55 0%, ${selectedModel.colors.secondary}35 50%, rgba(0, 0, 0, 0.75) 100%`,
          border: `${selectedModel.colors.primary}80`,
          glow: `${selectedModel.colors.primary}90`,
          text: "#ffffff",
          core: selectedModel.colors.primary,
        };
    }
  };

  // Constellation lines connecting related skills
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
  }, [nodes, nodePositions, selectedModel]);

  const activeHoveredNode = useMemo(() => {
    return nodes.find((n) => n.id === hoveredNodeId) || null;
  }, [nodes, hoveredNodeId]);

  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden select-none transition-colors duration-700"
      style={{
        backgroundColor: selectedModel.colors.bgColor,
        backgroundImage: selectedModel.colors.meshGradient,
      }}
    >
      {/* Dynamic Cosmic Gradient Tint matching the selected model */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse at 40% 30%, ${selectedModel.colors.primary}33 0%, transparent 65%), radial-gradient(ellipse at 75% 70%, ${selectedModel.colors.secondary}25 0%, transparent 60%), radial-gradient(circle at 15% 80%, ${selectedModel.colors.accent}18 0%, transparent 55%), ${selectedModel.colors.bgColor}`,
        }}
      />

      {/* Atmospheric Space Nebulae shifting with active model colors */}
      <div
        className="absolute top-1/4 left-1/4 w-[850px] h-[850px] rounded-full blur-[180px] pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${selectedModel.colors.primary}35 0%, transparent 70%)`,
        }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-[800px] h-[800px] rounded-full blur-[190px] pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${selectedModel.colors.secondary}28 0%, transparent 70%)`,
        }}
      />

      {/* Starfield Layer (Twinkling background stars) */}
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
              boxShadow: star.size > 1 ? "0 0 5px rgba(255,255,255,0.7)" : "none",
            }}
          />
        ))}
      </div>

      {/* Constellation Connection Lines */}
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

      {/* Minimalist Floating Search in Corner */}
      <div className="absolute top-5 right-6 z-30 w-52 sm:w-64">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search star cosmos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-full text-xs backdrop-blur-xl border text-white placeholder:text-zinc-500 focus:outline-none shadow-xl transition-all"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.65)",
              borderColor: `${selectedModel.colors.primary}35`,
            }}
          />
        </div>
      </div>

      {/* Scattered Organic Blobs - Fixed coordinates with smooth breathing/shine only */}
      <div className="absolute inset-0 w-full h-full z-10">
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
              animate={{
                boxShadow: [
                  `0 0 18px 2px ${palette.glow}, inset 0 0 8px rgba(255,255,255,0.15)`,
                  `0 0 40px 9px ${palette.glow}, inset 0 0 16px rgba(255,255,255,0.32)`,
                  `0 0 18px 2px ${palette.glow}, inset 0 0 8px rgba(255,255,255,0.15)`,
                ],
                opacity: isHighlighted ? [0.88, 1, 0.88] : 0.2,
              }}
              transition={{
                duration: pos.shineDuration,
                repeat: Infinity,
                delay: pos.shineDelay,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.25, zIndex: 45 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectNode(node)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              className="absolute cursor-pointer flex flex-col items-center justify-center select-none"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                width: `${pos.size}px`,
                height: `${pos.size}px`,
                transform: "translate(-50%, -50%)",
                borderRadius: pos.shape,
                background: `radial-gradient(circle at 35% 35%, rgba(255,255,255,0.2) 0%, transparent 60%), linear-gradient(135deg, ${palette.gradient})`,
                border: `1.5px solid ${palette.border}`,
                zIndex: isHovered ? 50 : Math.floor(pos.size / 10),
              }}
            >
              {/* Star Core Dot */}
              <div
                className="absolute w-2 h-2 rounded-full blur-[1px] opacity-85 top-2.5 right-3"
                style={{ background: palette.core }}
              />

              {/* Skill / Project Title */}
              <span className="font-extrabold text-[11px] sm:text-xs text-white tracking-tight text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] px-2 leading-tight">
                {node.name}
              </span>

              {/* Weight Pill for Major Blobs */}
              {pos.size >= 90 && (
                <span
                  className="mt-1 text-[9px] font-mono font-bold px-1.5 py-0.2 rounded-full opacity-85"
                  style={{
                    background: "rgba(0,0,0,0.45)",
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
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 max-w-xl w-[90%] backdrop-blur-2xl px-5 py-3 rounded-2xl border shadow-2xl flex items-center justify-between gap-4 pointer-events-none"
            style={{
              backgroundColor: "rgba(10, 5, 8, 0.85)",
              borderColor: `${selectedModel.colors.primary}40`,
            }}
          >
            <div className="flex items-center gap-3 truncate">
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
            <span
              className="text-[10px] font-bold shrink-0 uppercase tracking-wider"
              style={{ color: selectedModel.colors.primary }}
            >
              Click to Enlarge &rarr;
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
