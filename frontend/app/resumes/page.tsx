"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Search, RefreshCw, AlertCircle, Sparkles } from "lucide-react";
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Resume Library
            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
              {resumes.length} {resumes.length === 1 ? "Resume" : "Resumes"}
            </span>
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Your career knowledge base. Store multiple targeted versions (AI, Backend, Data, General) for semantic matching.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadResumes}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => setShowUploader((prev) => !prev)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>{showUploader ? "Close Uploader" : "Add Resume"}</span>
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

      {/* Search & Filter Bar */}
      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by label or filename..."
            className="w-full rounded-xl border border-zinc-800 bg-zinc-900/70 pl-9 pr-4 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
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
                className="h-48 rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="flex gap-3">
                  <div className="h-10 w-10 rounded-xl bg-zinc-800" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-zinc-800" />
                    <div className="h-3 w-1/2 rounded bg-zinc-800" />
                  </div>
                </div>
                <div className="h-16 rounded-xl bg-zinc-800/50" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-900/30 bg-rose-950/20 p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-rose-400" />
            <h3 className="mt-2 text-sm font-semibold text-rose-300">Connection Error</h3>
            <p className="mt-1 text-xs text-rose-400/80">{error}</p>
            <button
              onClick={loadResumes}
              className="mt-4 rounded-lg bg-zinc-800 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && resumes.length === 0 && !showUploader && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/20 p-12 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-zinc-200">No resumes uploaded yet</h3>
            <p className="mt-1 text-xs text-zinc-400 max-w-md">
              Start by uploading your existing resumes (e.g. AI Resume, Backend Resume). The system indexes them into ChromaDB for tailored matching.
            </p>
            <button
              onClick={() => setShowUploader(true)}
              className="mt-6 flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:brightness-110 active:scale-95 transition-all"
            >
              <Sparkles className="h-4 w-4" />
              <span>Upload Your First Resume</span>
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
