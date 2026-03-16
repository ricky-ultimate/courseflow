"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

interface ErrorStateProps {
  /** When provided, uses spec 19.2 format: "Failed to load data" + "An error occurred while fetching {entity}. Please try again." */
  entity?: string;
  /** Custom title (used when entity is not provided) */
  title?: string;
  /** Custom message (used when entity is not provided) */
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  entity,
  title = "Failed to load data",
  message = "An error occurred while fetching. Please try again.",
  onRetry,
}: ErrorStateProps) {
  const displayTitle = entity ? "Failed to load data" : title;
  const displayMessage = entity
    ? `An error occurred while fetching ${entity}. Please try again.`
    : message;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{displayTitle}</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-md">{displayMessage}</p>
      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          className="min-h-[44px] min-w-[44px] border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
        >
          Retry
        </Button>
      )}
    </div>
  );
}
