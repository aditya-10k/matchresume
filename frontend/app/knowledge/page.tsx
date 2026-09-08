"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  Orbit,
  Layers,
  BrainCircuit,
  Database,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import { useModel } from "@/context/ModelContext";
import {
  getKnowledgeUniverse,
  KnowledgeNode,
  KnowledgeUniverseResponse,
} from "@/lib/api/knowledge";
import FloatingBlobsCanvas from "@/components/knowledge/FloatingBlobsCanvas";
import BlobDetailModal from "@/components/knowledge/BlobDetailModal";

export default function KnowledgeUniversePage() {
  const { selectedModel } = useModel();
  const [data, setData] = useState<KnowledgeUniverseResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

  const loadUniverse = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getKnowledgeUniverse();
      setData(res);
    } catch (err: any) {
      setError(err.message || "Failed to load candidate knowledge universe.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUniverse();
  }, []);

  const handleSelectRelated = (nodeName: string) => {
    if (!data) return;
    const found = data.nodes.find(
      (n) => n.name.toLowerCase() === nodeName.toLowerCase()
    );
    if (found) {
      setSelectedNode(found);
    }
  };

  return (
    <AppShell>
      <div className="flex flex-col h-[calc(100vh-5rem)] p-4 sm:p-8 max-w-7xl mx-auto space-y-5">
        {/* Page Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div>
            <div className="flex items-center gap-2.5">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{
                  background: `${selectedModel.colors.primary}18`,
                  color: selectedModel.colors.primary,
                  border: `1px solid ${selectedModel.colors.primary}35`,
                }}
              >
                <Orbit className="h-5 w-5 animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
                  Knowledge Universe
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{
                      background: `${selectedModel.colors.primary}20`,
                      color: selectedModel.colors.primary,
                      border: `1px solid ${selectedModel.colors.primary}30`,
                    }}
                  >
                    ChromaDB Vector RAG
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
                  Interactive multi-dimensional visualization of verified candidate skills, systems, and evidence chunks.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          {data && (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/10 text-xs shadow-sm">
                <Database className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {data.total_nodes} Verified Nodes
                </span>
              </div>
              <button
                onClick={loadUniverse}
                disabled={loading}
                className="p-2 rounded-2xl bg-white/80 dark:bg-zinc-950/80 border border-zinc-200 dark:border-white/10 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-all shadow-sm"
                title="Refresh Knowledge Graph"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          )}
        </div>

        {/* Main Interactive Stage */}
        <div className="flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 rounded-3xl border border-zinc-200 dark:border-white/10 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-2xl flex flex-col items-center justify-center p-8 space-y-4 shadow-2xl">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-3xl animate-bounce"
                style={{
                  background: `${selectedModel.colors.primary}20`,
                  color: selectedModel.colors.primary,
                }}
              >
                <BrainCircuit className="h-8 w-8 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Mining Vector Knowledge Chunks...
                </h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                  Connecting to persistent ChromaDB index and extracting verified technical entities.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 rounded-3xl border border-rose-500/20 bg-rose-500/5 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
              <h3 className="text-base font-bold text-rose-600 dark:text-rose-400">
                Failed to Load Knowledge Graph
              </h3>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">{error}</p>
              <button
                onClick={loadUniverse}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900"
              >
                Try Again
              </button>
            </div>
          ) : data ? (
            <FloatingBlobsCanvas
              nodes={data.nodes}
              onSelectNode={(node) => setSelectedNode(node)}
              selectedNodeId={selectedNode?.id}
            />
          ) : null}
        </div>

        {/* Enlarged Blob Inspection Modal */}
        <BlobDetailModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSelectRelated={handleSelectRelated}
        />
      </div>
    </AppShell>
  );
}
