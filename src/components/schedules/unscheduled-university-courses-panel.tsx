"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Course } from "@/types";
import { LEVEL_PILL } from "@/lib/constants";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  CalendarPlus,
} from "lucide-react";

interface UnscheduledUniversityCoursesPanelProps {
  onScheduleCourse: (courseCode: string) => void;
  refreshKey?: number;
}

const INITIAL_VISIBLE = 5;

export function UnscheduledUniversityCoursesPanel({
  onScheduleCourse,
  refreshKey,
}: UnscheduledUniversityCoursesPanelProps) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [panelOpen, setPanelOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const fetchUnscheduled = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getUniversityCoursesWithoutSchedules();
      const r = getItemsFromResponse<Course>(res);
      if (r) {
        setCourses(r.items);
      } else if (res.success && Array.isArray(res.data)) {
        setCourses(res.data as Course[]);
      } else {
        setCourses([]);
      }
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUnscheduled();
  }, [fetchUnscheduled, refreshKey]);

  if (loading) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 animate-pulse">
        <div className="h-4 bg-red-200 rounded w-64" />
      </div>
    );
  }

  if (courses.length === 0) return null;

  const visible = showAll ? courses : courses.slice(0, INITIAL_VISIBLE);
  const hasMore = courses.length > INITIAL_VISIBLE;

  return (
    <div className="rounded-xl border border-red-200 bg-red-50">
      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
          <span className="text-sm font-medium text-red-800">
            {courses.length} university course{courses.length !== 1 ? "s" : ""}{" "}
            not yet scheduled — required before auto-generation
          </span>
        </div>
        {panelOpen ? (
          <ChevronUp className="h-4 w-4 text-red-600 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-red-600 shrink-0" />
        )}
      </button>

      {panelOpen && (
        <div className="border-t border-red-200">
          <div className="divide-y divide-red-100">
            {visible.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between gap-3 px-4 py-2.5"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                    {c.code}
                  </span>
                  <span className="text-sm text-gray-700 truncate">
                    {c.name}
                  </span>
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
                  className="shrink-0 h-8 border-red-300 text-red-800 hover:bg-red-100"
                  onClick={() => onScheduleCourse(c.code)}
                >
                  <CalendarPlus className="h-3 w-3 mr-1" />
                  Schedule
                </Button>
              </div>
            ))}
          </div>

          {hasMore && !showAll && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full px-4 py-2.5 text-xs font-medium text-red-700 hover:bg-red-100 border-t border-red-200 text-left transition-colors"
            >
              Show {courses.length - INITIAL_VISIBLE} more
            </button>
          )}
          {showAll && hasMore && (
            <button
              type="button"
              onClick={() => setShowAll(false)}
              className="w-full px-4 py-2.5 text-xs font-medium text-red-700 hover:bg-red-100 border-t border-red-200 text-left transition-colors"
            >
              Show less
            </button>
          )}
        </div>
      )}
    </div>
  );
}
