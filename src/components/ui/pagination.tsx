"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface PaginationProps {
  page: number
  totalPages: number
  total: number
  limit: number
  onPageChange: (page: number) => void
  onLimitChange?: (limit: number) => void
  limitOptions?: number[]
  /** Label for results, e.g. "results" or "schedules" */
  resultsLabel?: string
}

function getPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1)
  // Near start: [1, 2, 3, 4, 5, …, last]
  if (current <= 3) return [1, 2, 3, 4, 5, "ellipsis", total]
  // Near end: [1, …, last-4, last-3, last-2, last-1, last]
  if (current >= total - 2) return [1, "ellipsis", total - 4, total - 3, total - 2, total - 1, total]
  // Middle: [1, …, current-1, current, current+1, …, last]
  return [1, "ellipsis", current - 1, current, current + 1, "ellipsis", total]
}

export function Pagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  limitOptions = [10, 25, 50],
  resultsLabel = "results",
}: PaginationProps) {
  const start = (page - 1) * limit + 1
  const end = Math.min(page * limit, total)
  const pageNumbers = getPageNumbers(page, totalPages)

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-4 border-t border-[#F3F4F6]",
        "w-full"
      )}
    >
      {/* Left: Showing X–Y of Z results */}
      <p className="text-sm text-gray-500 order-2 md:order-1">
        Showing {start}–{end} of {total} {resultsLabel}
      </p>

      {/* Center: Page buttons — desktop: ChevronLeft | page numbers | ChevronRight; mobile: Prev | Page X of Y | Next */}
      <div className="flex items-center justify-center gap-2 order-1 md:order-2">
        {/* Mobile: Previous / Next full-text, min 44px */}
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="md:hidden min-h-[44px] px-4"
        >
          Previous
        </Button>
        <span className="text-sm text-gray-500 md:hidden">Page {page} of {totalPages}</span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="md:hidden min-h-[44px] px-4"
        >
          Next
        </Button>

        {/* Desktop: ChevronLeft | page numbers | ChevronRight */}
        <div className="hidden md:flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only">Previous</span>
          </Button>
          <div className="flex items-center gap-1">
            {pageNumbers.map((p, i) =>
              p === "ellipsis" ? (
                <span key={`ell-${i}`} className="px-2 text-gray-500">…</span>
              ) : (
                <Button
                  key={p}
                  variant={page === p ? "default" : "outline"}
                  size="icon"
                  onClick={() => onPageChange(p)}
                  className={cn(
                    "h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg",
                    page === p && "bg-indigo-600 hover:bg-indigo-700 text-white"
                  )}
                >
                  {p}
                </Button>
              )
            )}
          </div>
          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-lg"
          >
            <ChevronRight className="h-5 w-5" />
            <span className="sr-only">Next</span>
          </Button>
        </div>
      </div>

      {/* Right: Per-page select (desktop only; mobile: in Filter sheet) */}
      {onLimitChange && (
        <div className="hidden md:block order-3">
          <Select
            value={String(limit)}
            onValueChange={(v) => {
              onLimitChange(Number(v))
              onPageChange(1)
            }}
          >
            <SelectTrigger className="w-20 h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {limitOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)}>
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  )
}
