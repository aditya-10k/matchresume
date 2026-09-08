"use client";

import { useState, useRef, ChangeEvent, DragEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
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
      setErrorMessage("Please select a PDF file.");
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
      await new Promise((r) => setTimeout(r, 400)); // UI pacing

      setStep("extracting");
      await new Promise((r) => setTimeout(r, 600));

      setStep("indexing");
      const createdResume = await uploadResume(selectedFile, resumeName);

      setStep("ready");
      await new Promise((r) => setTimeout(r, 500));

      if (onSuccess) {
        onSuccess(createdResume);
      }

      // Reset after success
      setTimeout(() => {
        setSelectedFile(null);
        setResumeName("");
        setStep("idle");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload resume.");
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
    { id: "extracting", label: "Extracting Text" },
    { id: "indexing", label: "Indexing Knowledge" },
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
    <div className="w-full rounded-2xl border border-zinc-800/80 bg-gradient-to-b from-zinc-900/60 to-zinc-950/80 p-6 shadow-xl backdrop-blur-sm">
      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
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
            className={`group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition-all ${
              dragActive
                ? "border-indigo-500 bg-indigo-500/10 scale-[1.01]"
                : "border-zinc-700/60 hover:border-zinc-500 hover:bg-zinc-900/40"
            }`}
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800/80 text-zinc-300 shadow-inner group-hover:scale-110 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-all">
              <UploadCloud className="h-7 w-7" />
            </div>
            <h4 className="text-base font-semibold text-zinc-200">
              Drag and drop your resume PDF
            </h4>
            <p className="mt-1 text-xs text-zinc-400 max-w-sm">
              Upload AI, Backend, Data, or General resumes. The original document remains immutable.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-300 shadow hover:bg-zinc-700 transition-colors">
              <FileText className="h-4 w-4 text-indigo-400" />
              <span>Browse PDF</span>
            </div>
          </motion.div>
        )}

        {step === "idle" && selectedFile && (
          <motion.div
            key="file-configured"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="flex flex-col gap-5 rounded-xl border border-zinc-800 bg-zinc-900/50 p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-zinc-200">{selectedFile.name}</h4>
                  <p className="text-xs text-zinc-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB • PDF Document
                  </p>
                </div>
              </div>
              <button
                onClick={reset}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Change file
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-xs font-medium text-zinc-300">
                Resume Label / Target Role
              </label>
              <input
                type="text"
                value={resumeName}
                onChange={(e) => setResumeName(e.target.value)}
                placeholder="e.g. AI Resume, Senior Backend Resume"
                className="rounded-lg border border-zinc-700 bg-zinc-950 px-3.5 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={reset}
                className="rounded-lg px-4 py-2 text-xs font-medium text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={triggerUpload}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 active:scale-95 transition-all"
              >
                <Sparkles className="h-4 w-4" />
                <span>Upload & Index</span>
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
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
              {step === "ready" ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                </motion.div>
              ) : (
                <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
              )}
            </div>

            <h4 className="text-base font-semibold text-zinc-100">
              {step === "ready" ? "Indexed Successfully!" : "Processing Resume Knowledge"}
            </h4>
            <p className="mt-1 text-xs text-zinc-400">
              {step === "uploading" && "Sending PDF to server..."}
              {step === "extracting" && "Extracting text and identifying sections..."}
              {step === "indexing" && "Chunking text and storing knowledge in vector store..."}
              {step === "ready" && "Ready for job description matching and tailoring."}
            </p>

            {/* Stepper Progress Visualizer */}
            <div className="mt-8 grid grid-cols-4 w-full max-w-lg gap-2">
              {stages.map((stage) => {
                const status = getStageStatus(stage.id);
                return (
                  <div key={stage.id} className="flex flex-col items-center gap-2">
                    <div
                      className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                        status === "completed"
                          ? "bg-emerald-400"
                          : status === "active"
                          ? "bg-indigo-500 animate-pulse"
                          : "bg-zinc-800"
                      }`}
                    />
                    <span
                      className={`text-[11px] font-medium ${
                        status === "completed"
                          ? "text-emerald-400"
                          : status === "active"
                          ? "text-indigo-400"
                          : "text-zinc-500"
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
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-zinc-200">Upload Failed</h4>
            <p className="mt-1 text-xs text-rose-300 max-w-md">{errorMessage}</p>
            <button
              onClick={reset}
              className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Try Again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
