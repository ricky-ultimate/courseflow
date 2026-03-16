"use client";

import { createContext, useCallback, useContext, useState } from "react";

interface ActiveSessionContextValue {
  /** Increment to trigger consumers to refetch active session. Call after activate/archive. */
  invalidateCount: number;
  invalidateActiveSession: () => void;
}

const ActiveSessionContext = createContext<ActiveSessionContextValue | null>(null);

export function ActiveSessionProvider({ children }: { children: React.ReactNode }) {
  const [invalidateCount, setInvalidateCount] = useState(0);
  const invalidateActiveSession = useCallback(() => {
    setInvalidateCount((c) => c + 1);
  }, []);

  return (
    <ActiveSessionContext.Provider value={{ invalidateCount, invalidateActiveSession }}>
      {children}
    </ActiveSessionContext.Provider>
  );
}

export function useActiveSessionInvalidate() {
  const ctx = useContext(ActiveSessionContext);
  return ctx?.invalidateActiveSession ?? (() => {});
}

export function useActiveSessionInvalidateCount() {
  const ctx = useContext(ActiveSessionContext);
  return ctx?.invalidateCount ?? 0;
}
