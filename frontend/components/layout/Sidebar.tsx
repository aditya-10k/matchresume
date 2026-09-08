"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Layers,
  FileText,
  Plus,
  Sun,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Sparkles,
  Activity
} from "lucide-react";
import { checkBackendHealth } from "@/lib/api/resumes";
import { useModel } from "@/context/ModelContext";
import ModelSelector from "@/components/ui/ModelSelector";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { selectedModel, colorMode, toggleColorMode, isMounted } = useModel();
  const [health, setHealth] = useState<{ status: string; mock_rag: boolean } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    checkBackendHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: "offline", mock_rag: false }));
  }, []);

  const isLight = isMounted && colorMode === "light";

  const navLinks = [
    { href: "/", label: "Studio", icon: Layers },
    { href: "/resumes", label: "Resume Vault", icon: FileText },
    { href: "/applications/new", label: "New Tailor", icon: Plus },
  ];

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-black/70 px-4 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-200"
            aria-label="Open navigation drawer"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                color: "#fff",
              }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white">
              matchresume
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleColorMode}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 dark:border-white/10 bg-black/5 dark:bg-white/5 text-zinc-700 dark:text-zinc-300"
            title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
            suppressHydrationWarning
          >
            {isLight ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4 text-amber-300" />}
          </button>
        </div>
      </div>

      {/* Mobile Backdrop Drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div
            className="relative flex w-72 flex-col justify-between border-r border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 p-5 shadow-2xl z-10"
            style={{ borderRightColor: `${selectedModel.colors.primary}30` }}
          >
            <div>
              <div className="flex items-center justify-between pb-5 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-xl shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                      color: "#fff",
                    }}
                  >
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-white">
                    matchresume
                  </span>
                </div>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mobile Navigation */}
              <nav className="mt-6 flex flex-col gap-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? "border shadow-sm"
                          : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                      }`}
                      style={
                        isActive
                          ? {
                              background: `${selectedModel.colors.primary}18`,
                              borderColor: `${selectedModel.colors.primary}40`,
                              color: selectedModel.colors.primary,
                            }
                          : {}
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-6 pt-5 border-t border-zinc-200 dark:border-white/10">
                <div className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Active Intelligence Model
                </div>
                <ModelSelector direction="down" />
              </div>
            </div>

            {/* Mobile Footer */}
            <div className="border-t border-zinc-200 dark:border-white/10 pt-4 flex items-center justify-between text-xs text-zinc-500">
              <span className="font-mono">RAG: {health?.status === "healthy" ? (health.mock_rag ? "Mock RAG" : "ChromaDB") : "Offline"}</span>
              <button
                onClick={toggleColorMode}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-white/10 px-3 py-1 text-xs"
                suppressHydrationWarning
              >
                {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5 text-amber-300" />}
                <span>{isLight ? "Dark" : "Light"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Fixed Retractable Sidebar */}
      <aside
        className={`hidden md:flex fixed top-0 left-0 z-40 h-screen flex-col justify-between border-r border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/90 backdrop-blur-2xl transition-all duration-300 ease-in-out shadow-sm dark:shadow-2xl ${
          isCollapsed ? "w-20" : "w-64"
        }`}
      >
        {/* Top Header & Brand */}
        <div>
          <div className={`flex items-center h-16 px-4 border-b border-zinc-200/60 dark:border-white/5 ${isCollapsed ? "justify-center" : "justify-between"}`}>
            <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-1 group">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-105"
                style={{
                  background: `linear-gradient(135deg, ${selectedModel.colors.primary} 0%, ${selectedModel.colors.secondary} 100%)`,
                  boxShadow: `0 2px 10px ${selectedModel.colors.primary}35`,
                  color: "#fff",
                }}
              >
                <Sparkles className="h-4 w-4" />
              </div>
              {!isCollapsed && (
                <div className="flex flex-col min-w-0 truncate">
                  <span className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white truncate">
                    matchresume
                  </span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium truncate">
                    AI Career Studio
                  </span>
                </div>
              )}
            </Link>

            {/* Retract Button (Cleanly separated on the right, zero cramming or overlap) */}
            {!isCollapsed && (
              <button
                onClick={onToggleCollapse}
                className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors ml-2"
                title="Retract sidebar"
                aria-label="Retract sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* When Collapsed: Expand Icon at Top */}
          {isCollapsed && (
            <div className="flex justify-center py-2">
              <button
                onClick={onToggleCollapse}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Expand sidebar"
                aria-label="Expand sidebar"
              >
                <PanelLeftOpen className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="mt-4 px-3 flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`group relative flex items-center rounded-2xl px-3.5 py-3 text-xs font-semibold transition-all ${
                    isCollapsed ? "justify-center" : "gap-3"
                  } ${
                    isActive
                      ? "border shadow-sm"
                      : "text-zinc-600 dark:text-zinc-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-zinc-900 dark:hover:text-white"
                  }`}
                  style={
                    isActive
                      ? {
                          background: `${selectedModel.colors.primary}16`,
                          borderColor: `${selectedModel.colors.primary}35`,
                          color: selectedModel.colors.primary,
                        }
                      : {}
                  }
                  title={isCollapsed ? link.label : undefined}
                >
                  <Icon
                    className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110"
                    style={isActive ? { color: selectedModel.colors.primary } : {}}
                  />
                  {!isCollapsed && <span className="truncate">{link.label}</span>}

                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <span className="pointer-events-none absolute left-full ml-3 hidden rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-900 dark:bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl group-hover:block z-50 whitespace-nowrap">
                      {link.label}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Utility Bar */}
        <div className="p-3 border-t border-zinc-200/80 dark:border-white/10 flex flex-col gap-2.5">
          {/* Active Model Selector */}
          {!isCollapsed ? (
            <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/40 p-2 backdrop-blur-md">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-1 px-0.5">
                Active Intelligence
              </div>
              <ModelSelector direction="up" inSidebar={true} />
            </div>
          ) : (
            <div className="flex justify-center py-1" title={`Model: ${selectedModel.name}`}>
              <div
                className="h-3.5 w-3.5 rounded-full shadow-sm"
                style={{ backgroundColor: selectedModel.colors.primary }}
              />
            </div>
          )}

          {/* Theme Mode Toggle (Spacious, elegant, never overlapping) */}
          {!isCollapsed ? (
            <div className="flex items-center justify-between rounded-xl px-2.5 py-1.5 border border-zinc-200/70 dark:border-white/10 bg-zinc-50/70 dark:bg-zinc-900/40">
              <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400">
                Appearance
              </span>
              <button
                onClick={toggleColorMode}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 shadow-sm border border-zinc-200/80 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 transition-all active:scale-95"
                title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
                suppressHydrationWarning
              >
                {isLight ? (
                  <>
                    <Sun className="h-3.5 w-3.5 text-amber-500" />
                    <span>Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="h-3.5 w-3.5 text-blue-400" />
                    <span>Dark</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={toggleColorMode}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200/80 dark:border-white/10 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title={isLight ? "Switch to Dark Mode" : "Switch to Light Mode"}
                suppressHydrationWarning
              >
                {isLight ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-blue-400" />}
              </button>
            </div>
          )}

          {/* Health status */}
          {!isCollapsed ? (
            <div
              className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-[11px] border"
              style={{
                borderColor: `${selectedModel.colors.primary}20`,
                background: `${selectedModel.colors.primary}08`,
                color: selectedModel.colors.primary,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${
                    health?.status === "healthy"
                      ? health.mock_rag
                        ? "bg-amber-400 animate-pulse"
                        : "bg-emerald-400"
                      : "bg-rose-500"
                  }`}
                />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {health?.status === "healthy" ? (health.mock_rag ? "Mock RAG" : "ChromaDB") : "Offline"}
                </span>
              </div>
              <Activity className="h-3 w-3 opacity-60" />
            </div>
          ) : null}
        </div>
      </aside>
    </>
  );
}
