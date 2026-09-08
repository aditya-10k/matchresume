"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/layout/AppShell";
import { useModel } from "@/context/ModelContext";
import {
  getKnowledgeUniverse,
  KnowledgeNode,
  KnowledgeUniverseResponse,
} from "@/lib/api/knowledge";
import FloatingBlobsCanvas from "@/components/knowledge/FloatingBlobsCanvas";
import BlobDetailModal from "@/components/knowledge/BlobDetailModal";
import { BrainCircuit, AlertCircle, Orbit, Sparkles } from "lucide-react";

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
      setError(err.message || "Failed to load candidate knowledge cosmos.");
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
      <div className="flex flex-col h-[calc(100vh-4.5rem)] p-3 sm:p-5 max-w-[1700px] mx-auto space-y-3">
        {/* Minimalist Cosmic Header - No clunky category buttons/legends */}
        <div className="flex items-center justify-between shrink-0 px-2">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-2xl shadow-lg"
              style={{
                background: `${selectedModel.colors.primary}20`,
                color: selectedModel.colors.primary,
                border: `1px solid ${selectedModel.colors.primary}35`,
              }}
            >
              <Orbit className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-zinc-900 dark:text-white flex items-center gap-2">
                Knowledge Cosmos
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                  style={{
                    background: `${selectedModel.colors.primary}18`,
                    color: selectedModel.colors.primary,
                    border: `1px solid ${selectedModel.colors.primary}30`,
                  }}
                >
                  RAG Vector Starfield
                </span>
              </h1>
              <p className="text-xs text-zinc-500 hidden sm:block">
                Organic candidate knowledge nodes scattered across space. Drag or click any star blob to explore verified evidence.
              </p>
            </div>
          </div>
        </div>

        {/* Main Cosmic Stage */}
        <div className="flex-1 flex flex-col min-h-0">
          {loading ? (
            <div className="flex-1 rounded-3xl border border-white/10 bg-[#05060d] backdrop-blur-2xl flex flex-col items-center justify-center p-8 space-y-4 shadow-2xl">
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
                <h3 className="text-base font-bold text-white">
                  Igniting Knowledge Starfield...
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  Connecting to ChromaDB and mapping candidate skills as organic celestial blobs.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex-1 rounded-3xl border border-rose-500/20 bg-[#05060d] flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="h-10 w-10 text-rose-500 mb-2" />
              <h3 className="text-base font-bold text-rose-400">
                Failed to Load Knowledge Cosmos
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">{error}</p>
              <button
                onClick={loadUniverse}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-bold bg-white text-zinc-950"
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

        {/* Expanding Blob Inspection Modal */}
        <BlobDetailModal
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onSelectRelated={handleSelectRelated}
        />
      </div>
    </AppShell>
  );
}
