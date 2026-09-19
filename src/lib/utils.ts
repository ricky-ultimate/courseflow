import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ApiResponse, PageResult } from "@/types";
import { AVATAR_COLORS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function isPageResult<T>(value: unknown): value is PageResult<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as { items?: unknown }).items)
  );
}

export function getItemsFromResponse<T>(
  response: ApiResponse<unknown>,
): PageResult<T> | null {
  if (
    !response.success ||
    response.data === undefined ||
    response.data === null
  ) {
    return null;
  }
  const raw = response.data;
  if (Array.isArray(raw)) {
    return {
      items: raw as T[],
      total: raw.length,
      page: 1,
      limit: raw.length,
      totalPages: 1,
    };
  }
  return isPageResult<T>(raw) ? raw : null;
}

export function getInitials(
  name: string | null | undefined,
  email?: string,
): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2)
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    return (parts[0]![0] || "").toUpperCase();
  }
  if (email) return (email[0] || "?").toUpperCase();
  return "?";
}

export function getAvatarColor(name: string | null, email?: string): string {
  const str = name || email || "user";
  let hash = 0;
  for (let i = 0; i < str.length; i++)
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return (
    AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]
  );
}

export function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString();
}

export function formatLastLogin(iso: string | null | undefined): string {
  if (!iso) return "Never";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24)
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  return d.toLocaleDateString();
}

export function getStartHour(time: string): number {
  const [h] = time.split(":");
  return parseInt(h ?? "9", 10);
}
