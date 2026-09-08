"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, FileText, Layers, Bell, Menu, X, Plus } from "lucide-react";
import { checkBackendHealth } from "@/lib/api/resumes";

export default function Navbar() {
  const pathname = usePathname();
  const [health, setHealth] = useState<{ status: string; mock_rag: boolean } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    checkBackendHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline", mock_rag: false }));
  }, []);

  const navLinks = [
    { href: "/", label: "Studio", icon: Layers },
    { href: "/resumes", label: "Resume Vault", icon: FileText },
  ];

  return (
    <header className="sticky top-0 z-50 w-full px-3 py-3 sm:px-6 sm:py-4">
      <div className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-orange-500/20 bg-black/45 px-4 py-2.5 shadow-2xl backdrop-blur-2xl transition-all">
        {/* Brand & Monogram (Inspired by Roobinium header) */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-amber-700 shadow-md shadow-orange-500/30 ring-1 ring-orange-400/40 group-hover:scale-105 transition-transform">
            <div className="h-4 w-4 rounded-full border-2 border-black/80 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-black/80" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-tight text-white flex items-center gap-1.5">
              Resume Copilot
              <span className="rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[9px] font-medium text-orange-400 border border-orange-500/30">
                Aira OS
              </span>
            </span>
            <span className="text-[10px] text-orange-200/60 font-medium">Welcome back</span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                  isActive
                    ? "bg-orange-500/20 text-orange-200 border border-orange-500/30 shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-orange-400" : "text-zinc-500"}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons & Status */}
        <div className="flex items-center gap-2.5">
          {/* Health Pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border border-orange-500/20 bg-orange-950/30 px-3 py-1 text-[11px] text-orange-300">
            <span
              className={`h-2 w-2 rounded-full ${
                health?.status === "healthy"
                  ? health.mock_rag
                    ? "bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50"
                    : "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  : "bg-rose-500"
              }`}
            />
            <span className="font-medium">
              {health?.status === "healthy"
                ? health.mock_rag
                  ? "Mock RAG"
                  : "ChromaDB Core"
                : "Aira Offline"}
            </span>
          </div>

          <Link
            href="/applications/new"
            className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-orange-600/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">New Tailor</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-full border border-orange-500/20 bg-black/40 text-orange-300 hover:bg-orange-500/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-2 rounded-2xl border border-orange-500/20 bg-black/85 p-4 shadow-2xl backdrop-blur-2xl">
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "bg-orange-500/20 text-orange-200 border border-orange-500/30"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  <Icon className="h-4 w-4 text-orange-400" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
