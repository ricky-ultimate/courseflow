"use client";

import { AlertCircle } from "lucide-react";

/**
 * Spec 19.1: Server-side validation errors from response.error (comma-separated
 * from class-validator) displayed above submit button.
 */
export function ServerErrorBanner({ message }: { message: string }) {
  if (!message?.trim()) return null;
  const parts = message.split(",").map((s) => s.trim()).filter(Boolean);
  const display = parts.length > 1 ? parts.join(", ") : message.trim();
  return (
    <div
      className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
      role="alert"
    >
      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" aria-hidden />
      <p className="text-base leading-snug">{display}</p>
    </div>
  );
}
