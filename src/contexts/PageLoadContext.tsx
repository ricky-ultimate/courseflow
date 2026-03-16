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
  /** Call when the page's primary data has finished loading. */
  reportPageLoaded: () => void;
  /** True when the current page has reported loaded (reset on route change). */
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

/**
 * Call this hook with your page's loading state. When isLoading becomes false
 * (or is false on mount), the progress bar will complete to 100% (per spec 18.3).
 */
export function usePageLoadReporter(isLoading: boolean) {
  const ctx = usePageLoad();

  useEffect(() => {
    if (!isLoading) {
      ctx?.reportPageLoaded();
    }
  }, [isLoading, ctx]);
}
