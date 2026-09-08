"use client";

import { useServerStatus } from "@/context/ServerStatusContext";

export function ServerWakingBanner() {
  const { serverStatus, retryCount } = useServerStatus();

  if (serverStatus === "ready") return null;

  const isUnreachable = serverStatus === "unreachable";

  return (
    <div
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg backdrop-blur-md border"
      style={{
        background: isUnreachable
          ? "rgba(220, 38, 38, 0.15)"
          : "rgba(10, 6, 12, 0.75)",
        borderColor: isUnreachable
          ? "rgba(220, 38, 38, 0.4)"
          : "rgba(180, 120, 255, 0.25)",
        color: isUnreachable ? "#fca5a5" : "#e2d8f0",
      }}
    >
      {isUnreachable ? (
        <>
          <span className="text-red-400">⚠</span>
          Server unreachable — please refresh or try again later.
        </>
      ) : (
        <>
          {/* Animated pulse dot */}
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span
              className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
              style={{ background: "var(--orb-core, #a855f7)" }}
            />
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: "var(--orb-core, #a855f7)" }}
            />
          </span>
          Waking up server
          {retryCount > 0 && (
            <span style={{ opacity: 0.55 }}>· {retryCount * 4}s</span>
          )}
          <span className="flex gap-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="inline-block w-1 h-1 rounded-full animate-bounce"
                style={{
                  background: "var(--orb-core, #a855f7)",
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0.7,
                }}
              />
            ))}
          </span>
        </>
      )}
    </div>
  );
}
