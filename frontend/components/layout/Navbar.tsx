"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, FileText, Layers, Menu, X, Plus } from "lucide-react";
import { checkBackendHealth } from "@/lib/api/resumes";
import { useModel } from "@/context/ModelContext";
import ModelSelector from "@/components/ui/ModelSelector";

export default function Navbar() {
  const pathname = usePathname();
  const { selectedModel } = useModel();
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
      <div
        className="mx-auto flex max-w-6xl items-center justify-between rounded-full bg-black/50 px-4 py-2.5 shadow-2xl backdrop-blur-2xl transition-all duration-500"
        style={{
          border: `1px solid ${selectedModel.colors.primary}30`,
          boxShadow: `0 16px 40px -10px rgba(0,0,0,0.8), 0 0 20px ${selectedModel.colors.primary}15`,
        }}
      >
        {/* Brand & Monogram */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="relative flex h-9 w-9 items-center justify-center rounded-full shadow-md transition-all duration-500 group-hover:scale-105"
            style={{
              background: `radial-gradient(circle at 35% 30%, #fff 0%, ${selectedModel.colors.primary} 60%, #100508 100%)`,
              boxShadow: `0 0 15px ${selectedModel.colors.primary}50`,
            }}
          >
            <div className="h-4 w-4 rounded-full border-2 border-black/80 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-black/80" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold tracking-tight text-white flex items-center gap-1.5">
              Resume Copilot
              <span
                className="rounded-full px-1.5 py-0.2 text-[9px] font-medium transition-colors duration-500"
                style={{
                  background: `${selectedModel.colors.primary}18`,
                  color: selectedModel.colors.primary,
                  border: `1px solid ${selectedModel.colors.primary}35`,
                }}
              >
                {selectedModel.shortName}
              </span>
            </span>
            <span className="text-[10px] text-zinc-400 font-medium">Welcome back</span>
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
                    ? "text-white border shadow-sm"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
                style={
                  isActive
                    ? {
                        background: `${selectedModel.colors.primary}20`,
                        borderColor: `${selectedModel.colors.primary}40`,
                        color: "#fff",
                      }
                    : {}
                }
              >
                <Icon
                  className="h-3.5 w-3.5"
                  style={isActive ? { color: selectedModel.colors.primary } : {}}
                />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Action Icons, Model Selector & Status */}
        <div className="flex items-center gap-2.5">
          {/* Quick Model Selector in Header */}
          <div className="hidden lg:block">
            <ModelSelector />
          </div>

          {/* Health Pill */}
          <div
            className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] transition-colors duration-500"
            style={{
              borderColor: `${selectedModel.colors.primary}25`,
              background: `${selectedModel.colors.primary}10`,
              color: selectedModel.colors.primary,
            }}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                health?.status === "healthy"
                  ? health.mock_rag
                    ? "bg-amber-400 animate-pulse shadow-sm shadow-amber-400/50"
                    : "bg-emerald-400 shadow-sm shadow-emerald-400/50"
                  : "bg-rose-500"
              }`}
            />
            <span className="font-medium text-zinc-300">
              {health?.status === "healthy"
                ? health.mock_rag
                  ? "Mock RAG"
                  : "ChromaDB"
                : "Offline"}
            </span>
          </div>

          <Link
            href="/applications/new"
            className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all"
            style={{
              background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
              boxShadow: `0 4px 15px ${selectedModel.colors.primary}40`,
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden xs:inline">New Tailor</span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-300 hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div
          className="md:hidden mt-2 rounded-3xl border bg-black/90 p-4 shadow-2xl backdrop-blur-2xl"
          style={{ borderColor: `${selectedModel.colors.primary}30` }}
        >
          <div className="mb-3 border-b border-white/10 pb-3">
            <div className="text-[11px] font-semibold text-zinc-400 mb-2">Switch Model:</div>
            <ModelSelector />
          </div>
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-2.5 text-xs font-medium transition-all ${
                    isActive
                      ? "text-white border"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                  style={
                    isActive
                      ? {
                          background: `${selectedModel.colors.primary}20`,
                          borderColor: `${selectedModel.colors.primary}40`,
                        }
                      : {}
                  }
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: selectedModel.colors.primary }}
                  />
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
