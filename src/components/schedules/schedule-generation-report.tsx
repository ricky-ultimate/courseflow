"use client";

import { ReactNode, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarPlus,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DAY_MEDIUM_LABELS, LEVEL_PILL } from "@/lib/constants";
import {
  ScheduleGenerationSummary,
  formatGenerationMessage,
  hasGenerationIssues,
} from "@/lib/schedule-generation";
import { Semester, SessionType, UnscheduledCourse } from "@/types";

const SCHEDULED_PREVIEW_SIZE = 25;

interface CollapsibleSectionProps {
  title: string;
  count: number;
  tone: "warning" | "neutral";
  defaultOpen?: boolean;
  children: ReactNode;
}

function CollapsibleSection({
  title,
  count,
  tone,
  defaultOpen = false,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const wrapper =
    tone === "warning"
      ? "border-amber-200 bg-amber-50"
      : "border-gray-200 bg-white";
  const label = tone === "warning" ? "text-amber-900" : "text-gray-900";
  const divider = tone === "warning" ? "border-amber-200" : "border-gray-200";

  return (
    <div className={`rounded-lg border ${wrapper}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-left"
      >
        <span className={`text-sm font-medium ${label}`}>
          {title} ({count})
        </span>
        {open ? (
          <ChevronUp className={`h-4 w-4 shrink-0 ${label}`} />
        ) : (
          <ChevronDown className={`h-4 w-4 shrink-0 ${label}`} />
        )}
      </button>
      {open && <div className={`border-t ${divider}`}>{children}</div>}
    </div>
  );
}

interface ScheduleGenerationReportProps {
  summary: ScheduleGenerationSummary;
  canScheduleCourse: (course: UnscheduledCourse) => boolean;
  onScheduleCourses: (courses: UnscheduledCourse[]) => void;
}

export function ScheduleGenerationReport({
  summary,
  canScheduleCourse,
  onScheduleCourses,
}: ScheduleGenerationReportProps) {
  const [showAllScheduled, setShowAllScheduled] = useState(false);
  const hasIssues = hasGenerationIssues(summary);

  const sortedScheduled = useMemo(
    () =>
      [...summary.scheduledCourses].sort((a, b) =>
        a.courseCode.localeCompare(b.courseCode),
      ),
    [summary.scheduledCourses],
  );
  const visibleScheduled = showAllScheduled
    ? sortedScheduled
    : sortedScheduled.slice(0, SCHEDULED_PREVIEW_SIZE);
  const schedulable = summary.unscheduledCourses.filter(canScheduleCourse);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {hasIssues ? (
          <AlertCircle className="h-8 w-8 text-amber-500 shrink-0" />
        ) : (
          <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
        )}
        <div>
          <p className="font-semibold text-gray-900">
            {hasIssues ? "Completed with warnings" : "Schedules generated"}
          </p>
          <p className="text-sm text-gray-600" role="status">
            {formatGenerationMessage(summary)}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1.5">
        <div className="flex justify-between">
          <span className="text-gray-500">Session</span>
          <span className="font-medium">{summary.sessionName}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Semester</span>
          <span className="font-medium">
            {summary.semester === Semester.FIRST ? "First" : "Second"}
          </span>
        </div>
        {summary.departmentCode && (
          <div className="flex justify-between">
            <span className="text-gray-500">Department</span>
            <span className="font-medium">{summary.departmentCode}</span>
          </div>
        )}
        {summary.programme && (
          <div className="flex justify-between">
            <span className="text-gray-500">Programme</span>
            <span className="font-medium">{summary.programme}</span>
          </div>
        )}
        {summary.totalDepartments !== null && (
          <div className="flex justify-between">
            <span className="text-gray-500">Departments processed</span>
            <span className="font-medium">
              {summary.processedDepartments ?? 0} / {summary.totalDepartments}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-gray-500">Total courses</span>
          <span className="font-medium">{summary.totalCourses}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Scheduled</span>
          <span className="font-medium text-green-700">
            {summary.scheduledCount}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Failed</span>
          <span
            className={`font-medium ${summary.failedCount > 0 ? "text-amber-700" : ""}`}
          >
            {summary.failedCount}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">
            Preserved manual or pinned slots
          </span>
          <span className="font-medium">{summary.preservedOverrides}</span>
        </div>
        {summary.skippedLockedDepartments > 0 && (
          <div className="flex justify-between">
            <span className="text-gray-500">Skipped locked departments</span>
            <span className="font-medium">
              {summary.skippedLockedDepartments}
            </span>
          </div>
        )}
      </div>

      {summary.departmentErrors.length > 0 && (
        <CollapsibleSection
          title="Departments with errors"
          count={summary.departmentErrors.length}
          tone="warning"
          defaultOpen
        >
          <ul className="max-h-40 overflow-y-auto divide-y divide-amber-100">
            {summary.departmentErrors.map((error) => (
              <li
                key={error.departmentCode}
                className="flex items-start gap-2 px-3 py-2 text-xs text-amber-900"
              >
                <span className="font-mono font-semibold shrink-0 bg-amber-100 px-1.5 py-0.5 rounded">
                  {error.departmentCode}
                </span>
                <span>{error.message}</span>
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {summary.unscheduledCourses.length > 0 && (
        <CollapsibleSection
          title="Courses that could not be scheduled"
          count={summary.unscheduledCourses.length}
          tone="warning"
          defaultOpen
        >
          <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-amber-200">
            <p className="text-xs text-amber-900">
              Review the reason for each course, then assign a time slot
              manually.
            </p>
            {schedulable.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 h-8 border-amber-300 text-amber-900 hover:bg-amber-100"
                onClick={() => onScheduleCourses(schedulable)}
              >
                <CalendarPlus className="h-3.5 w-3.5 mr-1.5" />
                Schedule {schedulable.length}
              </Button>
            )}
          </div>
          <ul className="max-h-64 overflow-y-auto divide-y divide-amber-100">
            {summary.unscheduledCourses.map((course) => (
              <li
                key={course.courseCode}
                className="flex flex-col gap-2 px-3 py-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {course.courseCode}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${LEVEL_PILL[course.level] ?? ""}`}
                    >
                      {course.level.replace("LEVEL_", "")}L
                    </Badge>
                    <span className="text-xs font-mono bg-white/70 border border-amber-200 px-2 py-0.5 rounded">
                      {course.departmentCode}
                    </span>
                    <span className="text-xs text-gray-500">
                      {course.semester === Semester.FIRST
                        ? "First semester"
                        : "Second semester"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800">{course.courseName}</p>
                  <p className="text-xs text-amber-800">{course.reason}</p>
                </div>
                {canScheduleCourse(course) && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 h-8 border-amber-300 text-amber-900 hover:bg-amber-100"
                    onClick={() => onScheduleCourses([course])}
                  >
                    Schedule
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {sortedScheduled.length > 0 && (
        <CollapsibleSection
          title="Scheduled courses"
          count={sortedScheduled.length}
          tone="neutral"
        >
          <ul className="max-h-64 overflow-y-auto divide-y divide-gray-100">
            {visibleScheduled.map((assignment) => (
              <li
                key={`${assignment.courseCode}-${assignment.sessionType ?? SessionType.THEORY}`}
                className="flex items-center justify-between gap-3 px-3 py-2 text-sm"
              >
                <span className="font-mono text-xs font-semibold text-indigo-600">
                  {assignment.courseCode}
                  {assignment.sessionType === SessionType.PRACTICAL
                    ? " (P)"
                    : ""}
                </span>
                <span className="text-xs text-gray-600">
                  {DAY_MEDIUM_LABELS[assignment.dayOfWeek]}{" "}
                  {assignment.startTime} – {assignment.endTime}
                </span>
              </li>
            ))}
          </ul>
          {sortedScheduled.length > SCHEDULED_PREVIEW_SIZE && (
            <button
              type="button"
              onClick={() => setShowAllScheduled((value) => !value)}
              className="w-full px-3 py-2 text-xs font-medium text-indigo-600 hover:bg-gray-50 border-t border-gray-100 text-left"
            >
              {showAllScheduled
                ? "Show fewer"
                : `Show all ${sortedScheduled.length}`}
            </button>
          )}
        </CollapsibleSection>
      )}
    </div>
  );
}
