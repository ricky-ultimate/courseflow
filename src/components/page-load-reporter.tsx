"use client";

import { usePageLoadReporter } from "@/contexts/PageLoadContext";

/**
 * Renders nothing. Reports page load on mount for static/server-rendered pages
 * that have no async data (e.g. home, settings).
 */
export function ReportPageLoadOnMount() {
  usePageLoadReporter(false);
  return null;
}
