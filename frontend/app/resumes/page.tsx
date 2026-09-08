"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, RefreshCw, AlertCircle, Sparkles, Database } from "lucide-react";
import { fetchResumes, deleteResume } from "@/lib/api/resumes";
import { Resume } from "@/lib/types";
import ResumeCard from "@/components/resumes/ResumeCard";
import UploadDropzone from "@/components/resumes/UploadDropzone";

export default function ResumesPage() {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUploader, setShowUploader] = useState(false);

  const loadResumes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchResumes();
      setResumes(data);
    } catch (err: any) {
      setError(err.message || "Failed to load resumes. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteResume(id);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete resume");
    }
  };

  const handleUploadSuccess = (newResume: Resume) => {
    setResumes((prev) => [newResume, ...prev]);
    setShowUploader(false);
  };

  const filteredResumes = resumes.filter((r) =>
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Background ambient glow */}
      <div className="pointer-events-none absolute top-10 right-10 h-72 w-72 rounded-full bg-orange-600/10 blur-[100px] -z-10" />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-orange-500/15 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            Career Vault
            <span className="rounded-full bg-orange-500/15 px-2.5 py-0.5 text-xs font-semibold text-orange-400 border border-orange-500/25">
              {resumes.length} Ingested
            </span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-orange-200/60">
            Factual career knowledge base. Store targeted resumes (AI, Backend, Data, General) for semantic RAG retrieval.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadResumes}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-orange-500/20 bg-black/40 text-orange-300 hover:bg-orange-500/15 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowUploader((prev) => !prev)}
            className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-orange-600/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{showUploader ? "Close Uploader" : "Add to Vault"}</span>
          </button>
        </div>
      </div>

      {/* Upload Dropzone Collapse */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden pt-6"
          >
            <UploadDropzone onSuccess={handleUploadSuccess} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Bar */}
      <div className="mt-8 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-orange-400/50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by label or filename..."
            className="w-full rounded-full border border-orange-500/20 bg-black/40 pl-10 pr-4 py-2 text-xs text-white placeholder:text-zinc-600 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 transition-all"
          />
        </div>
      </div>

      {/* Content State */}
      <div className="mt-8">
        {loading && resumes.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-48 rounded-3xl border border-orange-500/15 bg-black/40 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-orange-500/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-orange-500/10" />
                    <div className="h-3 w-1/2 rounded bg-orange-500/10" />
                  </div>
                </div>
                <div className="h-16 rounded-2xl bg-orange-500/5" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-rose-900/30 bg-rose-950/20 p-8 text-center backdrop-blur-xl">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
            <h3 className="mt-2 text-sm font-semibold text-rose-200">Connection Disrupted</h3>
            <p className="mt-1 text-xs text-rose-300/80">{error}</p>
            <button
              onClick={loadResumes}
              className="mt-4 rounded-full border border-rose-500/30 bg-rose-950/40 px-5 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/20 transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {!loading && !error && resumes.length === 0 && !showUploader && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-3xl border border-orange-500/15 bg-black/30 p-12 text-center backdrop-blur-xl"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-600/15 to-transparent border border-orange-500/30 text-orange-400 shadow-inner">
              <Database className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-white">Your Career Vault is empty</h3>
            <p className="mt-1 text-xs text-orange-200/60 max-w-sm">
              Upload existing PDF resumes (e.g. AI, Backend, General). They will be extracted, chunked, and indexed into ChromaDB for factual RAG retrieval.
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="mt-6 flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-600/30 hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Upload First Resume</span>
            </button>
          </motion.div>
        )}

        {!loading && filteredResumes.length > 0 && (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredResumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  resume={resume}
                  onDelete={handleDelete}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!loading && resumes.length > 0 && filteredResumes.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-xs text-zinc-500">No resumes matching &quot;{searchQuery}&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
