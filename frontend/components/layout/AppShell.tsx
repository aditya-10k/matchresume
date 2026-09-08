"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("matchresume_sidebar_collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("matchresume_sidebar_collapsed", String(next));
      return next;
    });
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row antialiased">
      <Sidebar isCollapsed={isCollapsed} onToggleCollapse={toggleCollapse} />
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? "md:pl-20" : "md:pl-64"
        }`}
      >
        <main className="flex-1 flex flex-col min-h-0">{children}</main>
      </div>
    </div>
  );
}
