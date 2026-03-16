"use client";

import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon className="h-16 w-16 text-gray-300 mb-4" />
      <h3 className="text-base font-semibold text-gray-700 mt-4">{title}</h3>
      {subtitle && <p className="text-sm text-gray-400 mt-2">{subtitle}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
