"use client";

import { Lock } from "lucide-react";

/**
 * Spec 19.4: In-page amber banner for 403 Forbidden.
 * [Lock icon — amber] "You do not have permission to perform this action."
 * Do not redirect. Do not clear the token.
 */
export function ForbiddenBanner({
  onDismiss,
}: {
  onDismiss?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800"
      role="alert"
    >
      <Lock className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
      <p className="flex-1 text-sm font-medium">
        You do not have permission to perform this action.
      </p>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-amber-700 hover:text-amber-900 underline text-sm font-medium"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
