"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { apiClient } from "@/lib/api";

interface ForbiddenContextValue {
  forbidden: boolean;
  setForbidden: (value: boolean) => void;
}

const ForbiddenContext = createContext<ForbiddenContextValue | null>(null);

export function ForbiddenProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    setForbidden(false);
  }, [pathname]);

  useEffect(() => {
    const handle403 = () => {
      setForbidden(true);
    };
    apiClient.setOn403(handle403);
    return () => apiClient.setOn403(null);
  }, []);

  return (
    <ForbiddenContext.Provider value={{ forbidden, setForbidden }}>
      {children}
    </ForbiddenContext.Provider>
  );
}

export function useForbidden() {
  const ctx = useContext(ForbiddenContext);
  if (!ctx) return null;
  return ctx;
}
