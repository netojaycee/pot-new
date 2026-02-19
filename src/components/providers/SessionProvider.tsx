"use client";

import { useEffect } from "react";
import { useSessionStore } from "@/stores/session.store";

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const fetchSession = useSessionStore((state) => state.fetchSession);

  useEffect(() => {
    // Fetch session on mount (page reload)
    fetchSession();
  }, [fetchSession]);

  return <>{children}</>;
}
