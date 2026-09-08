"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { uploadResume } from "@/lib/api/resumes";
import { Resume } from "@/lib/types";
import { useModel } from "@/context/ModelContext";

interface UploadDropzoneProps {
  onSuccess?: (newResume: Resume) => void;
}

type StepState = "idle" | "uploading" | "extracting" | "indexing" | "ready" | "error";

export default function UploadDropzone({ onSuccess }: UploadDropzoneProps) {
  const { selectedModel } = useModel();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [step, setStep] = useState<StepState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  };

  const handleFileSelected = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Please select a valid PDF file.");
      setStep("error");
      return;
    }
    setSelectedFile(file);
    const suggestedName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    setResumeName(suggestedName);
    setErrorMessage("");
    setStep("idle");
  };

  const triggerUpload = async () => {
    if (!selectedFile) return;

    try {
      setStep("uploading");
      await new Promise((r) => setTimeout(r, 450));

      setStep("extracting");
      await new Promise((r) => setTimeout(r, 650));

      setStep("indexing");
      const createdResume = await uploadResume(selectedFile, resumeName);

      setStep("ready");
      await new Promise((r) => setTimeout(r, 550));

      if (onSuccess) {
        onSuccess(createdResume);
      }

      setTimeout(() => {
        setSelectedFile(null);
        setResumeName("");
        setStep("idle");
      }, 1400);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to index resume.");
      setStep("error");
    }
  };

  const reset = () => {
    setSelectedFile(null);
    setResumeName("");
    setStep("idle");
    setErrorMessage("");
  };

  const stages = [
    { id: "uploading", label: "Upload" },
    { id: "extracting", label: "Text Extraction" },
    { id: "indexing", label: "RAG Ingestion" },
    { id: "ready", label: "Indexed" },
  ];

  const getStageStatus = (stageId: string) => {
    const order = ["uploading", "extracting", "indexing", "ready"];
    const currentIndex = order.indexOf(step);
    const targetIndex = order.indexOf(stageId);
    if (step === "ready") return "completed";
    if (currentIndex === targetIndex) return "active";
    if (currentIndex > targetIndex) return "completed";
    return "pending";
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-white/80 dark:bg-black/60 p-6 sm:p-8 backdrop-blur-2xl shadow-xl dark:shadow-2xl transition-colors duration-500"
      style={{ border: `1px solid ${selectedModel.colors.primary}25` }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <AnimatePresence mode="wait">
        {step === "idle" && !selectedFile && (
          <motion.div
            key="drop-idle"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition-all ${
              dragActive ? "scale-[1.01]" : ""
            }`}
            style={{
              borderColor: dragActive ? selectedModel.colors.primary : `${selectedModel.colors.primary}30`,
              backgroundColor: dragActive ? `${selectedModel.colors.primary}12` : "transparent",
            }}
          >
            <div
              className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-md group-hover:scale-110 transition-all"
              style={{
                background: `${selectedModel.colors.primary}18`,
                border: `1px solid ${selectedModel.colors.primary}35`,
                color: selectedModel.colors.primary,
              }}
            >
              <UploadCloud className="h-7 w-7" />
            </div>
            <h4 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
              Drop your resume PDF into the Vault
            </h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 max-w-sm">
              Upload AI, Backend, Data, or General resumes. The original document remains immutable.
            </p>
            <div
              className="mt-5 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium shadow transition-all hover:brightness-110"
              style={{
                borderColor: `${selectedModel.colors.primary}30`,
                background: `${selectedModel.colors.primary}15`,
                color: selectedModel.colors.primary,
              }}
            >
              <FileText className="h-3.5 w-3.5" style={{ color: selectedModel.colors.primary }} />
              <span>Browse File</span>
            </div>
          </motion.div>
        )}

        {step === "idle" && selectedFile && (
          <motion.div
            key="file-selected"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-5 rounded-2xl border bg-zinc-50/90 dark:bg-black/50 p-6"
            style={{ borderColor: `${selectedModel.colors.primary}25` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-2xl border"
                  style={{
                    background: `${selectedModel.colors.primary}15`,
                    borderColor: `${selectedModel.colors.primary}30`,
                    color: selectedModel.colors.primary,
                  }}
                >
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">{selectedFile.name}</h4>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono">
                    {(selectedFile.size / 1024).toFixed(1)} KB • PDF Document
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-xs transition-colors hover:underline"
                style={{ color: selectedModel.colors.primary }}
              >
                Change
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Resume Label / Specialization
              </label>
              <input
                type="text"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                placeholder="e.g. AI & ML Resume, Senior Backend Resume"
                className="rounded-xl border bg-white dark:bg-black/60 px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none transition-all"
                style={{ borderColor: `${selectedModel.colors.primary}30` }}
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={reset}
                className="rounded-full px-4 py-2 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={triggerUpload}
                className="inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-xs font-semibold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
                style={{
                  background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                  boxShadow: `0 4px 15px ${selectedModel.colors.primary}40`,
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Index into ChromaDB</span>
              </button>
            </div>
          </motion.div>
        )}

        {(step === "uploading" || step === "extracting" || step === "indexing" || step === "ready") && (
          <motion.div
            key="processing-stepper"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div
              className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border shadow-inner"
              style={{
                background: `${selectedModel.colors.primary}12`,
                borderColor: `${selectedModel.colors.primary}30`,
              }}
            >
              {step === "ready" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 className="h-8 w-8" style={{ color: selectedModel.colors.primary }} />
                </motion.div>
              ) : (
                <Loader2 className="h-8 w-8 animate-spin" style={{ color: selectedModel.colors.primary }} />
              )}
            </div>

            <h4 className="text-base font-semibold text-zinc-900 dark:text-white">
              {step === "ready" ? "Indexed Into Career Vault" : "Processing Resume Knowledge"}
            </h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 max-w-sm">
              {step === "uploading" && "Uploading document to secure server..."}
              {step === "extracting" && "Extracting raw text and identifying career sections..."}
              {step === "indexing" && "Chunking text & dispatching to ChromaDB RAG store..."}
              {step === "ready" && "Ready for job description matching & LaTeX generation."}
            </p>

            <div className="mt-7 grid grid-cols-4 w-full max-w-md gap-2">
              {stages.map((stage) => {
                const status = getStageStatus(stage.id);
                return (
                  <div key={stage.id} className="flex flex-col items-center gap-1.5">
                    <div
                      className="h-1.5 w-full rounded-full transition-all duration-300"
                      style={{
                        background:
                          status === "completed" || status === "active"
                            ? selectedModel.colors.primary
                            : "rgba(150, 150, 150, 0.2)",
                        opacity: status === "active" ? 0.75 : 1,
                      }}
                    />
                    <span
                      className="text-[10px] font-medium tracking-tight"
                      style={{
                        color:
                          status === "completed" || status === "active"
                            ? selectedModel.colors.primary
                            : undefined,
                      }}
                    >
                      {stage.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {step === "error" && (
          <motion.div
            key="error-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-6 text-center"
          >
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white">Indexing Failed</h4>
            <p className="mt-1 text-xs text-rose-500 dark:text-rose-300/80 max-w-md">{errorMessage}</p>
            <button
              onClick={reset}
              className="mt-4 rounded-full border px-5 py-1.5 text-xs font-medium transition-all hover:brightness-110"
              style={{
                borderColor: `${selectedModel.colors.primary}30`,
                background: `${selectedModel.colors.primary}15`,
                color: selectedModel.colors.primary,
              }}
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
