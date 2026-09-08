"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  Plus,
  ArrowUpRight,
  Trash2,
  Calendar,
  Building2,
  Search,
  Sparkles,
  FileText,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { listApplications, deleteApplication } from "@/lib/api/applications";
import { Application } from "@/lib/types";
import { useModel } from "@/context/ModelContext";

export default function ApplicationsPage() {
  const { selectedModel } = useModel();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await listApplications();
      setApplications(data);
    } catch (err: any) {
      setError(err.message || "Failed to load job applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this job application and all associated tailored resumes?")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteApplication(id);
      setApplications((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete application");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = applications.filter((app) => {
    const query = searchQuery.toLowerCase();
    const role = (app.role_title || "").toLowerCase();
    const company = (app.company || "").toLowerCase();
    return role.includes(query) || company.includes(query);
  });

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full -z-10 transition-colors duration-700"
        style={{
          background: `radial-gradient(circle, ${selectedModel.colors.primary}15 0%, transparent 70%)`,
        }}
      />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
              <Briefcase className="h-4 w-4" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
              Application Vault
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
            Job Applications & Tailored Resumes
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Browse match scores, analyze requirements, and continue editing in LaTeX Studio
          </p>
        </div>

        <Link
          href="/applications/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02] active:scale-95"
        >
          <Plus className="h-4 w-4" />
          <span>New Application</span>
        </Link>
      </div>

      {/* Search & Filter Bar */}
      <div className="my-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role title or company..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/50 shadow-sm"
          />
        </div>
        <div className="text-xs text-zinc-500 font-medium">
          {filtered.length} {filtered.length === 1 ? "application" : "applications"} tracked
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-600 dark:text-red-300">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mb-3" />
          <p className="text-xs font-medium text-zinc-500">Loading your applications...</p>
        </div>
      ) : filtered.length === 0 ? (
        /* Empty state */
        <div className="py-20 flex flex-col items-center justify-center text-center rounded-2xl border border-dashed border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/30 p-8">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500 mb-4">
            <Briefcase className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
            {searchQuery ? "No matching applications found" : "No applications yet"}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6">
            {searchQuery
              ? `No applications matched "${searchQuery}". Try a different keyword.`
              : "Paste a job description or upload a JD PDF to let our multi-agent pipeline score candidate fit and synthesize a tailored LaTeX resume."}
          </p>
          {!searchQuery && (
            <Link
              href="/applications/new"
              className="inline-flex items-center gap-2 rounded-xl bg-orange-600 hover:bg-orange-500 px-4 py-2 text-xs font-semibold text-white shadow-md transition hover:scale-105"
            >
              <Plus className="w-4 h-4" />
              <span>Tailor Your First Resume</span>
            </Link>
          )}
        </div>
      ) : (
        /* Applications grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((app) => {
            const score = app.match_score;
            const scoreColor =
              score !== undefined
                ? score >= 80
                  ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                  : score >= 60
                  ? "text-amber-500 bg-amber-500/10 border-amber-500/20"
                  : "text-rose-500 bg-rose-500/10 border-rose-500/20"
                : "text-zinc-400 bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-white/10";

            return (
              <div
                key={app.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md hover:border-orange-500/40 transition-all duration-200"
              >
                <div>
                  {/* Top card row: Company & Match Badge */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                        <Building2 className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 truncate">
                        {app.company || "Direct Application"}
                      </span>
                    </div>

                    {score !== undefined ? (
                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${scoreColor}`}
                      >
                        {score}% Match
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-white/10">
                        New
                      </span>
                    )}
                  </div>

                  {/* Role title */}
                  <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white line-clamp-2 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                    {app.role_title || "Target Position"}
                  </h3>

                  {/* JD excerpt */}
                  <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-3 leading-relaxed">
                    {app.jd_text}
                  </p>
                </div>

                {/* Footer metadata & actions */}
                <div className="mt-5 pt-3.5 border-t border-zinc-100 dark:border-white/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-zinc-400 text-[11px]">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(app.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDelete(app.id, e)}
                      disabled={deletingId === app.id}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                      title="Delete Application"
                    >
                      {deletingId === app.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <Link
                      href={`/applications/${app.id}/tailor`}
                      className="flex items-center gap-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-semibold px-2.5 py-1 text-xs transition"
                      title="Open in LaTeX Studio"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>LaTeX Studio</span>
                    </Link>

                    <Link
                      href={`/applications/${app.id}`}
                      className="flex items-center gap-0.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium px-2 py-1 text-xs transition"
                      title="View Analysis"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
