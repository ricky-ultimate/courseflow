"use client";

import { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: ReactNode;
  className?: string;
}

export function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
  className,
}: FilterBarProps) {
  const hasSearch = onSearchChange !== undefined;
  const hasChildren = !!children;

  return (
    <div
      className={cn(
        "flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm w-full",
        className,
      )}
    >
      {hasSearch && (
        <div className="relative flex-1 w-full min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <Input
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 pl-9 h-10 w-full"
          />
        </div>
      )}

      {hasSearch && hasChildren && (
        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-700 shrink-0" />
      )}

      {hasChildren && (
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar px-1 flex-wrap sm:flex-nowrap">
          {children}
        </div>
      )}
    </div>
  );
}
