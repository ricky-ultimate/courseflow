"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Course } from "@/types";
import { LEVEL_PILL } from "@/lib/constants";
import { AlertTriangle, ChevronDown, ChevronUp, Plus } from "lucide-react";

interface UnscheduledCoursesPanelProps {
  onAddSchedule: (courseCode: string) => void;
}

const INITIAL_VISIBLE = 5;

export function UnscheduledCoursesPanel({
  onAddSchedule,
}: UnscheduledCoursesPanelProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchUnscheduled = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getCoursesWithoutSchedules();
      const r = getItemsFromResponse<Course>(res);
      setCourses(r?.items ?? []);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnscheduled();
  }, [fetchUnscheduled]);

  if (loading) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 animate-pulse">
        <div className="h-4 bg-amber-200 rounded w-56" />
      </div>
    );
  }

  if (courses.length === 0) return null;

  const visible = showAll ? courses : courses.slice(0, INITIAL_VISIBLE);
  const hasMore = courses.length > INITIAL_VISIBLE;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50">
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          <span className="text-sm font-medium text-amber-800">
            {courses.length} course{courses.length !== 1 ? "s" : ""} not yet scheduled
          </span>
        </div>
        {panelOpen ? (
          <ChevronUp className="h-4 w-4 text-amber-600 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-amber-600 shrink-0" />
        )}
      </button>

      {panelOpen && (
        <div className="border-t border-amber-200">
          <div className="divide-y divide-amber-100">
            {visible.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                    {c.code}
                  </span>
                  <span className="text-sm text-gray-700 truncate">{c.name}</span>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 text-xs ${LEVEL_PILL[c.level] ?? ""}`}
                  >
                    {c.level.replace("LEVEL_", "")}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0 h-8 border-amber-300 text-amber-800 hover:bg-amber-100"
                  onClick={() => onAddSchedule(c.code)}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Schedule
                </Button>
              </div>
            ))}
          </div>

          {hasMore && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full px-4 py-2.5 text-xs font-medium text-amber-700 hover:bg-amber-100 border-t border-amber-200 text-left transition-colors"
            >
              Show {courses.length - INITIAL_VISIBLE} more
            </button>
          )}
          {showAll && hasMore && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="w-full px-4 py-2.5 text-xs font-medium text-amber-700 hover:bg-amber-100 border-t border-amber-200 text-left transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
