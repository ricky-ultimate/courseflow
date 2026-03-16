"use client";

import { useEffect } from "react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

/**
 * Spec 19.5: When apiClient returns statusCode: 0 (network failure),
 * show a persistent error toast (no auto-dismiss) with a "Retry" button
 * that re-fires the last action.
 */
export function NetworkErrorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { toast } = useToast();

  useEffect(() => {
    const handleNetworkError = (retry: () => Promise<any>) => {
      const { dismiss } = toast({
        title: "Network error. Please check your connection.",
        variant: "error",
        persistent: true,
        action: (
          <ToastAction
            altText="Retry"
            onClick={() => {
              dismiss();
              retry();
            }}
          >
            Retry
          </ToastAction>
        ),
      });
    };
    apiClient.setOnNetworkError(handleNetworkError);
    return () => apiClient.setOnNetworkError(null);
  }, [toast]);

  return <>{children}</>;
}
