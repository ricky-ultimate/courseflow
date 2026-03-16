import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { ApiResponse, PaginatedResponse } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normalize API response into { items, total, totalPages }.
 * Handles:
 * - Plain array: response.data = T[]
 * - New paginated: response.data = { data: { items, pagination } }
 * - Legacy paginated: response.data = { data: T[], total, totalPages }
 */
export function getItemsFromResponse<T>(
  response: ApiResponse<any>
): { items: T[]; total: number; totalPages: number } | null {
  if (!response.success || response.data == null) return null
  const raw = response.data

  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length, totalPages: 1 }
  }

  // New format: { data: { items: T[], pagination: { total, totalPages } } }
  const inner = raw?.data
  if (inner && typeof inner === "object" && Array.isArray(inner.items)) {
    const pagination = inner.pagination || {}
    return {
      items: inner.items,
      total: pagination.total ?? inner.items.length,
      totalPages: pagination.totalPages ?? 1,
    }
  }

  // Legacy: { data: T[], total, totalPages }
  if (inner && Array.isArray(inner)) {
    return {
      items: inner,
      total: raw.total ?? inner.length,
      totalPages: raw.totalPages ?? 1,
    }
  }

  return null
}
