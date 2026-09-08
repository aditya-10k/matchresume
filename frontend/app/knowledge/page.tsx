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
import { BrainCircuit, AlertCircle } from "lucide-react";

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
      {/* Full screen starry container - Covers whole screen, no outer margins or title headers */}
      <div className="relative w-full h-[100dvh] overflow-hidden bg-[#030611]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-4 bg-[#030611]">
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
                Mapping Candidate Vector Cosmos...
              </h3>
              <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                Mining ChromaDB knowledge chunks and positioning organic star blobs.
              </p>
            </div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-[#030611]">
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
