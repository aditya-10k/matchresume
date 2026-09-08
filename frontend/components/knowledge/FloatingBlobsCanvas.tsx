"use client";

import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { KnowledgeNode } from "@/lib/api/knowledge";
import { useModel } from "@/context/ModelContext";
import {
  Code2,
  Cpu,
  Briefcase,
  Compass,
  Sparkles,
  Search,
  Filter,
} from "lucide-react";

interface FloatingBlobsCanvasProps {
  nodes: KnowledgeNode[];
  onSelectNode: (node: KnowledgeNode) => void;
  selectedNodeId?: string | null;
}

export default function FloatingBlobsCanvas({
  nodes,
  onSelectNode,
  selectedNodeId,
}: FloatingBlobsCanvasProps) {
  const { selectedModel } = useModel();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesCat = activeCategory === "all" || n.category === activeCategory;
      const matchesSearch =
        !searchQuery.trim() ||
        n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (n.sub_category && n.sub_category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (n.highlight && n.highlight.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [nodes, activeCategory, searchQuery]);

  const getNodeStyle = (node: KnowledgeNode) => {
    switch (node.category) {
      case "skills":
        return {
          bg: "from-emerald-500/20 to-teal-500/10",
          border: "border-emerald-500/40 hover:border-emerald-400",
          glow: "rgba(16, 185, 129, 0.35)",
          text: "text-emerald-300",
          dot: "bg-emerald-400",
          tagBg: "bg-emerald-500/20 text-emerald-300",
        };
      case "projects":
        return {
          bg: "from-blue-500/20 to-cyan-500/10",
          border: "border-blue-500/40 hover:border-blue-400",
          glow: "rgba(59, 130, 246, 0.35)",
          text: "text-blue-300",
          dot: "bg-blue-400",
          tagBg: "bg-blue-500/20 text-blue-300",
        };
      case "experience":
        return {
          bg: "from-amber-500/20 to-orange-500/10",
          border: "border-amber-500/40 hover:border-amber-400",
          glow: "rgba(245, 158, 11, 0.35)",
          text: "text-amber-300",
          dot: "bg-amber-400",
          tagBg: "bg-amber-500/20 text-amber-300",
        };
      case "domains":
      default:
        return {
          bg: "from-purple-500/20 to-pink-500/10",
          border: "border-purple-500/40 hover:border-purple-400",
          glow: "rgba(139, 92, 246, 0.35)",
          text: "text-purple-300",
          dot: "bg-purple-400",
          tagBg: "bg-purple-500/20 text-purple-300",
        };
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search & Category Filter Command Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-zinc-950/70 border border-zinc-200 dark:border-white/10 backdrop-blur-xl shrink-0 shadow-lg">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "all", label: "All Universe", icon: Sparkles },
            { id: "skills", label: "Skills", icon: Code2 },
            { id: "projects", label: "Projects", icon: Cpu },
            { id: "experience", label: "Experience", icon: Briefcase },
            { id: "domains", label: "Domains", icon: Compass },
          ].map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 shadow-md scale-105"
                    : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-70">
                  (
                  {cat.id === "all"
                    ? nodes.length
                    : nodes.filter((n) => n.category === cat.id).length}
                  )
                </span>
              </button>
            );
          })}
        </div>

        {/* Live Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
          <input
            type="text"
            placeholder="Search verified skills & projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 focus:outline-none focus:ring-1 transition-all text-zinc-900 dark:text-white placeholder:text-zinc-400"
            style={{
              borderColor: searchQuery ? selectedModel.colors.primary : undefined,
            }}
          />
        </div>
      </div>

      {/* Floating Blobs Universe Surface */}
      <div className="relative flex-1 min-h-[550px] rounded-3xl border border-zinc-200 dark:border-white/10 bg-gradient-to-b from-zinc-50/50 to-zinc-100/50 dark:from-zinc-950/80 dark:to-black/80 backdrop-blur-2xl p-6 overflow-hidden flex flex-col justify-center items-center shadow-2xl">
        {/* Constellation Grid Background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(${selectedModel.colors.primary} 1px, transparent 1px)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Ambient Center Glow */}
        <div
          className="absolute w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ background: selectedModel.colors.primary }}
        />

        {filteredNodes.length === 0 ? (
          <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center">
            <Sparkles className="h-10 w-10 text-zinc-400 mb-3 animate-pulse" />
            <h3 className="text-base font-bold text-zinc-700 dark:text-zinc-300">
              No matching knowledge nodes found
            </h3>
            <p className="text-xs text-zinc-400 mt-1 max-w-sm">
              Try adjusting your search query or switching categories.
            </p>
          </div>
        ) : (
          <div className="relative z-10 w-full h-full flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 p-2 overflow-y-auto max-h-[620px]">
            {filteredNodes.map((node, index) => {
              const style = getNodeStyle(node);
              // Calculate dynamic sizing based on weight
              const isLarge = node.weight >= 85;
              const isMedium = node.weight >= 65 && node.weight < 85;
              
              // Organic floating animation parameters based on index
              const duration = 4 + (index % 5) * 0.8;
              const delay = (index % 7) * 0.3;
              const yOffset = (index % 2 === 0 ? 1 : -1) * (6 + (index % 4) * 2);

              return (
                <motion.div
                  key={node.id}
                  layoutId={`blob-${node.id}`}
                  animate={{
                    y: [0, yOffset, 0],
                  }}
                  transition={{
                    duration: duration,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "easeInOut",
                    delay: delay,
                  }}
                  whileHover={{ scale: 1.08, zIndex: 30 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSelectNode(node)}
                  className={`cursor-pointer group relative rounded-2xl sm:rounded-3xl border bg-gradient-to-br ${style.bg} ${style.border} backdrop-blur-xl shadow-lg transition-all duration-300 flex flex-col justify-between ${
                    isLarge
                      ? "p-4 sm:p-5 min-w-[170px] sm:min-w-[210px] min-h-[95px]"
                      : isMedium
                      ? "p-3.5 sm:p-4 min-w-[140px] sm:min-w-[170px] min-h-[80px]"
                      : "p-3 min-w-[120px] sm:min-w-[140px] min-h-[70px]"
                  }`}
                  style={{
                    boxShadow: `0 8px 25px -6px ${style.glow}`,
                  }}
                >
                  {/* Subtle inner light orb */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full animate-pulse ${style.dot}`} />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                        {node.sub_category || node.category}
                      </span>
                    </span>
                    <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${style.tagBg}`}>
                      {node.weight}%
                    </span>
                  </div>

                  <div className="my-1.5">
                    <h4 className="font-extrabold text-sm sm:text-base text-zinc-900 dark:text-white tracking-tight group-hover:text-white transition-colors">
                      {node.name}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="truncate max-w-[110px] sm:max-w-[140px] text-[10px] opacity-80">
                      {node.level}
                    </span>
                    <span className="text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-zinc-300">
                      Inspect &rarr;
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
