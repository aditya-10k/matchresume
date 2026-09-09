"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useModel } from "@/context/ModelContext";
import { useAuth } from "@/context/AuthContext";
import {
  getKnowledgeUniverse,
  KnowledgeNode,
  KnowledgeUniverseResponse,
} from "@/lib/api/knowledge";
import FloatingBlobsCanvas from "@/components/knowledge/FloatingBlobsCanvas";
import BlobDetailModal from "@/components/knowledge/BlobDetailModal";
import { BrainCircuit, AlertCircle, LogIn, Upload, Sparkles } from "lucide-react";

export default function KnowledgeUniversePage() {
  const { selectedModel } = useModel();
  const { user, token, openAuthModal, loading: authLoading } = useAuth();
  const [data, setData] = useState<KnowledgeUniverseResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);

  const loadUniverse = async () => {
    if (!token || !user) {
      setLoading(false);
      setData(null);
      return;
    }
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
    if (!authLoading) {
      loadUniverse();
    }
  }, [token, user, authLoading]);

  const handleSelectRelated = (nodeName: string) => {
    if (!data) return;
    const found = data.nodes.find(
      (n) => n.name.toLowerCase() === nodeName.toLowerCase()
    );
    if (found) {
      setSelectedNode(found);
    }
  };

  // Full screen edge-to-edge container (no duplicate AppShell or vertical strip)
  return (
    <div
      className="relative w-full h-[100dvh] overflow-hidden transition-colors duration-700"
      style={{ backgroundColor: selectedModel.colors.bgColor }}
    >
      {authLoading || loading ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 space-y-4"
          style={{ backgroundColor: selectedModel.colors.bgColor }}
        >
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
      ) : !token || !user ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
          style={{ backgroundColor: selectedModel.colors.bgColor }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-3xl mb-4"
            style={{
              background: `${selectedModel.colors.primary}20`,
              color: selectedModel.colors.primary,
            }}
          >
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Your Knowledge Universe is Waiting
          </h2>
          <p className="text-xs text-zinc-400 mt-2 max-w-md leading-relaxed">
            Sign in and upload your resume to generate your personal 3D interactive skill cosmos, technology graphs, and verified project star map.
          </p>
          <button
            onClick={openAuthModal}
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-black transition-transform hover:scale-105"
            style={{ background: selectedModel.colors.primary }}
          >
            <LogIn className="w-4 h-4" />
            Sign In / Register
          </button>
        </div>
      ) : error ? (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
          style={{ backgroundColor: selectedModel.colors.bgColor }}
        >
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
      ) : data && data.nodes && data.nodes.length > 0 ? (
        <FloatingBlobsCanvas
          nodes={data.nodes}
          onSelectNode={(node) => setSelectedNode(node)}
          selectedNodeId={selectedNode?.id}
          onRefresh={loadUniverse}
          isRefreshing={loading}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center"
          style={{ backgroundColor: selectedModel.colors.bgColor }}
        >
          <div
            className="flex h-16 w-16 items-center justify-center rounded-3xl mb-4"
            style={{
              background: `${selectedModel.colors.primary}20`,
              color: selectedModel.colors.primary,
            }}
          >
            <BrainCircuit className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-white">
            No Resumes Indexed Yet
          </h2>
          <p className="text-xs text-zinc-400 mt-2 max-w-md leading-relaxed">
            Upload your resume PDF in the Resume Vault to synthesize your interactive candidate knowledge cosmos.
          </p>
          <Link
            href="/resumes"
            className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-black transition-transform hover:scale-105"
            style={{ background: selectedModel.colors.primary }}
          >
            <Upload className="w-4 h-4" />
            Go to Resume Vault
          </Link>
        </div>
      )}

      {/* Expanding Blob Inspection Modal */}
      <BlobDetailModal
        node={selectedNode}
        onClose={() => setSelectedNode(null)}
        onSelectRelated={handleSelectRelated}
      />
    </div>
  );
}
