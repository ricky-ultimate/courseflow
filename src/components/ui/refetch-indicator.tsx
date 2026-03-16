"use client";

import { Loader2 } from "lucide-react";

/**
 * Spec 18.4: Small spinning indicator in the top-right corner of the content
 * card/table when re-fetching. Prevents layout shift.
 */
export function RefetchIndicator() {
  return (
    <div
      className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 shadow-sm ring-1 ring-gray-200"
      aria-hidden
    >
      <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
    </div>
  );
}
