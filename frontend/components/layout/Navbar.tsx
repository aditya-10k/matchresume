"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, FileText, PlusCircle, Layers, Activity } from "lucide-react";
import { checkBackendHealth } from "@/lib/api/resumes";

export default function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<{ status: string; mock_rag: boolean } | null>(null);

  useEffect(() => {
    checkBackendHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline", mock_rag: false }));
  }, []);

  const navLinks = [
    { href: "/", label: "Dashboard", icon: Layers },
    { href: "/resumes", label: "Resume Library", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/60 bg-zinc-950/75 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-semibold tracking-tight text-zinc-100 flex items-center gap-1.5">
                Resume Copilot
                <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[10px] font-medium text-indigo-400 border border-indigo-500/20">
                  MVP
                </span>
              </span>
              <span className="text-[11px] text-zinc-400">AI Career Intelligence</span>
            </div>
          </Link>

          {/* Nav items */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-zinc-800/80 text-zinc-100 shadow-sm shadow-black/20"
                      : "text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? "text-indigo-400" : "text-zinc-400"}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side status & action */}
        <div className="flex items-center gap-4">
          {/* Health indicator badge */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1 text-xs text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
                health?.status === "healthy"
                  ? health.mock_rag
                    ? "bg-amber-400 animate-pulse"
                    : "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  : "bg-rose-500"
              }`}
            />
            <span>
              {health?.status === "healthy"
                ? health.mock_rag
                  ? "Mock RAG Mode"
                  : "ChromaDB Connected"
                : "Backend Offline"}
            </span>
          </div>

          <Link
            href="/applications/new"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:brightness-110 active:scale-95"
          >
            <PlusCircle className="h-4 w-4" />
            <span>New Job Match</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
