"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles, ArrowUpRight } from "lucide-react";
import { uploadResume } from "@/lib/api/resumes";
import { Resume } from "@/lib/types";

interface UploadDropzoneProps {
  onSuccess?: (newResume: Resume) => void;
}

type StepState = "idle" | "uploading" | "extracting" | "indexing" | "ready" | "error";

export default function UploadDropzone({ onSuccess }: UploadDropzoneProps) {
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
    { id: "uploading", label: "Uploading" },
    { id: "extracting", label: "Extracting" },
    { id: "indexing", label: "ChromaDB Index" },
    { id: "ready", label: "Vault Ready" },
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
    <div className="relative overflow-hidden rounded-3xl border border-orange-500/20 bg-white/80 dark:bg-black/60 p-6 sm:p-8 backdrop-blur-2xl shadow-xl dark:shadow-2xl">
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
              dragActive
                ? "border-orange-500 bg-orange-500/10 scale-[1.01]"
                : "border-orange-500/20 hover:border-orange-500/45 hover:bg-orange-500/5"
            }`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-600/20 to-transparent border border-orange-500/30 text-orange-500 dark:text-orange-400 shadow-md group-hover:scale-110 group-hover:border-orange-400 transition-all">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h4 className="text-base font-semibold text-zinc-900 dark:text-white tracking-tight">
              Drop your resume PDF into the Vault
            </h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400 max-w-sm">
              Upload AI, Backend, Data, or General resumes. The original document remains immutable.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-orange-500/25 bg-orange-500/10 dark:bg-orange-950/20 px-4 py-2 text-xs font-medium text-orange-700 dark:text-orange-200 shadow hover:bg-orange-500/20 transition-all">
              <FileText className="h-3.5 w-3.5 text-orange-500 dark:text-orange-400" />
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
            className="flex flex-col gap-5 rounded-2xl border border-orange-500/20 bg-zinc-50/90 dark:bg-black/50 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/15 text-orange-500 dark:text-orange-400 border border-orange-500/30">
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
                className="text-xs text-orange-600/70 dark:text-orange-300/60 hover:text-orange-600 dark:hover:text-orange-300 transition-colors"
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
                className="rounded-xl border border-orange-500/20 bg-white dark:bg-black/60 px-4 py-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
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
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-600/30 hover:brightness-110 active:scale-95 transition-all"
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
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10 border border-orange-500/30 shadow-inner">
              {step === "ready" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 className="h-8 w-8 text-orange-500 dark:text-orange-400" />
                </motion.div>
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-orange-500 dark:text-orange-400" />
              )}
            </div>

            <h4 className="text-base font-semibold text-zinc-900 dark:text-white">
              {step === "ready" ? "Indexed Into Career Vault" : "Processing Resume Knowledge"}
            </h4>
            <p className="mt-1 text-xs text-zinc-600 dark:text-orange-200/60 max-w-sm">
              {step === "uploading" && "Uploading document to secure server..."}
              {step === "extracting" && "Extracting raw text and identifying career sections..."}
              {step === "indexing" && "Chunking text & dispatching to ChromaDB RAG store..."}
              {step === "ready" && "Ready for job description matching & LaTeX generation."}
            </p>

            {/* Stepper Progress Visualizer */}
            <div className="mt-7 grid grid-cols-4 w-full max-w-md gap-2">
              {stages.map((stage) => {
                const status = getStageStatus(stage.id);
                return (
                  <div key={stage.id} className="flex flex-col items-center gap-1.5">
                    <div
                      className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                        status === "completed"
                          ? "bg-gradient-to-r from-amber-400 to-orange-500"
                          : status === "active"
                          ? "bg-orange-500 animate-pulse"
                          : "bg-zinc-200 dark:bg-white/10"
                      }`}
                    />
                    <span
                      className={`text-[10px] font-medium tracking-tight ${
                        status === "completed"
                          ? "text-orange-600 dark:text-orange-300"
                          : status === "active"
                          ? "text-orange-500 dark:text-orange-400"
                          : "text-zinc-400 dark:text-zinc-600"
                      }`}
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
            <h4 className="text-sm font-semibold text-white">Indexing Failed</h4>
            <p className="mt-1 text-xs text-rose-300/80 max-w-md">{errorMessage}</p>
            <button
              onClick={reset}
              className="mt-4 rounded-full border border-orange-500/30 bg-orange-950/20 px-5 py-1.5 text-xs font-medium text-orange-200 hover:bg-orange-500/20 transition-all"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
