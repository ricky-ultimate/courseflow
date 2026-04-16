"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { usePathname } from "next/navigation";

interface PageLoadContextValue {
  reportPageLoaded: () => void;
  pageLoaded: boolean;
}

const PageLoadContext = createContext<PageLoadContextValue | null>(null);

export function PageLoadProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pageLoaded, setPageLoaded] = useState(false);

  useEffect(() => {
    setPageLoaded(false);
  }, [pathname]);

  const reportPageLoaded = useCallback(() => {
    setPageLoaded(true);
  }, []);

  return (
    <PageLoadContext.Provider value={{ pageLoaded, reportPageLoaded }}>
      {children}
    </PageLoadContext.Provider>
  );
}

export function usePageLoad() {
  const ctx = useContext(PageLoadContext);
  if (!ctx) return null;
  return ctx;
}

export function usePageLoadReporter(isLoading: boolean) {
  const ctx = usePageLoad();

  useEffect(() => {
    if (!isLoading) {
      ctx?.reportPageLoaded();
    }
  }, [isLoading, ctx]);
}
