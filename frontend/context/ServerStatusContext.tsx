"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_BASE } from "@/lib/api/client";

type ServerStatus = "checking" | "ready" | "unreachable";

interface ServerStatusContextType {
  serverStatus: ServerStatus;
  retryCount: number;
}

const ServerStatusContext = createContext<ServerStatusContextType>({
  serverStatus: "checking",
  retryCount: 0,
});

const POLL_INTERVAL_MS = 4000;
const MAX_RETRIES = 30;

export function ServerStatusProvider({ children }: { children: React.ReactNode }) {
  const [serverStatus, setServerStatus] = useState<ServerStatus>("checking");
  const [retryCount, setRetryCount] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    async function ping(attempt: number) {
      if (!mountedRef.current) return;
      try {
        const res = await fetch(API_BASE + "/health", {
          method: "GET",
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
        });
        if (!mountedRef.current) return;
        if (res.ok) {
          setServerStatus("ready");
          return; // terminate polling
        }
      } catch {
        // network error or timeout — keep retrying
      }
      if (!mountedRef.current) return;
      const next = attempt + 1;
      setRetryCount(next);
      if (next >= MAX_RETRIES) {
        setServerStatus("unreachable");
        return;
      }
      timerRef.current = setTimeout(() => ping(next), POLL_INTERVAL_MS);
    }

    ping(0);

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <ServerStatusContext.Provider value={{ serverStatus, retryCount }}>
      {children}
    </ServerStatusContext.Provider>
  );
}

export function useServerStatus() {
  return useContext(ServerStatusContext);
}
