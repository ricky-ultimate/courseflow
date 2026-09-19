"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import {
  AlertCircle,
  CheckCircle,
  Loader2,
  RotateCcw,
  Wand2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  DayOfWeek,
  ScheduleAssignment,
  SessionType,
  UnscheduledCourse,
} from "@/types";
import {
  DAY_LABELS,
  LEVEL_PILL,
  SLOT_MAP,
  WEDNESDAY_SLOT_MAP,
  WEEKDAYS,
} from "@/lib/constants";

interface ManualEntry {
  course: UnscheduledCourse;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  hasConflict: boolean;
}

interface SubmitResult {
  code: string;
  success: boolean;
  error?: string;
}

interface ManualScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courses: UnscheduledCourse[];
  onScheduled: (assignments: ScheduleAssignment[]) => void;
}

const MANUAL_SCHEDULING_DAYS = WEEKDAYS.filter(
  (day) => day !== DayOfWeek.FRIDAY,
);

function toEntry(course: UnscheduledCourse): ManualEntry {
  return {
    course,
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    hasConflict: false,
  };
}

function getStartTimes(dayOfWeek: string): string[] {
  if (!dayOfWeek) return [];
  const map = dayOfWeek === DayOfWeek.WEDNESDAY ? WEDNESDAY_SLOT_MAP : SLOT_MAP;
  return Object.keys(map);
}

function getEndTimes(dayOfWeek: string, startTime: string): string[] {
  if (!dayOfWeek || !startTime) return [];
  const map = dayOfWeek === DayOfWeek.WEDNESDAY ? WEDNESDAY_SLOT_MAP : SLOT_MAP;
  return map[startTime] ?? [];
}

export function ManualScheduleModal({
  open,
  onOpenChange,
  courses,
  onScheduled,
}: ManualScheduleModalProps) {
  const { toast } = useToast();
  const [entries, setEntries] = useState<ManualEntry[]>([]);
  const [recommending, setRecommending] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [submitResults, setSubmitResults] = useState<SubmitResult[]>([]);

  const requestRecommendations = useCallback(async (codes: string[]) => {
    if (codes.length === 0) return;
    setRecommending(true);
    setRecommendationError("");
    try {
      const res = await apiClient.recommendUniversitySlots(codes);
      const slots = res.data;
      if (res.success && slots) {
        setEntries((prev) =>
          prev.map((entry) => {
            const match = slots.find(
              (slot) => slot.courseCode === entry.course.courseCode,
            );
            if (!match) return entry;
            if (match.hasConflict) return { ...entry, hasConflict: true };
            return {
              ...entry,
              dayOfWeek: match.dayOfWeek,
              startTime: match.startTime,
              endTime: match.endTime,
              hasConflict: false,
            };
          }),
        );
      } else {
        setRecommendationError(
          res.error ?? "Failed to generate recommended slots.",
        );
      }
    } catch {
      setRecommendationError("Failed to generate recommended slots.");
    } finally {
      setRecommending(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const initial = courses.map(toEntry);
    setEntries(initial);
    setDone(false);
    setSubmitResults([]);
    setValidationError("");
    setRecommendationError("");
    void requestRecommendations(
      initial.map((entry) => entry.course.courseCode),
    );
  }, [open, courses, requestRecommendations]);

  const updateEntry = (
    index: number,
    field: "dayOfWeek" | "startTime" | "endTime",
    value: string,
  ) => {
    setEntries((prev) =>
      prev.map((entry, i) => {
        if (i !== index) return entry;
        const next: ManualEntry = {
          ...entry,
          [field]: value,
          hasConflict: false,
        };
        if (field === "dayOfWeek") {
          next.startTime = "";
          next.endTime = "";
        }
        if (field === "startTime") next.endTime = "";
        return next;
      }),
    );
  };

  const clearEntry = (index: number) => {
    setEntries((prev) =>
      prev.map((entry, i) => (i === index ? toEntry(entry.course) : entry)),
    );
  };

  const allComplete =
    entries.length > 0 &&
    entries.every((e) => e.dayOfWeek && e.startTime && e.endTime);
  const conflictCount = entries.filter((e) => e.hasConflict).length;

  const handleSubmit = async () => {
    const incomplete = entries.filter(
      (e) => !e.dayOfWeek || !e.startTime || !e.endTime,
    );
    if (incomplete.length > 0) {
      setValidationError(
        `Complete all fields before submitting. ${incomplete.length} ${incomplete.length === 1 ? "course still needs" : "courses still need"} a time slot.`,
      );
      return;
    }
    setValidationError("");
    setSubmitting(true);

    const results: SubmitResult[] = [];
    const assignments: ScheduleAssignment[] = [];

    for (const entry of entries) {
      try {
        const res = await apiClient.createSchedule({
          courseCode: entry.course.courseCode,
          dayOfWeek: entry.dayOfWeek as DayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
        });
        if (res.success) {
          results.push({ code: entry.course.courseCode, success: true });
          assignments.push({
            courseCode: entry.course.courseCode,
            dayOfWeek: entry.dayOfWeek as DayOfWeek,
            startTime: entry.startTime,
            endTime: entry.endTime,
            semester: entry.course.semester,
            sessionType: SessionType.THEORY,
          });
        } else {
          results.push({
            code: entry.course.courseCode,
            success: false,
            error: res.error ?? "Failed to create schedule",
          });
        }
      } catch {
        results.push({
          code: entry.course.courseCode,
          success: false,
          error: "Request failed",
        });
      }
    }

    setSubmitResults(results);
    setSubmitting(false);
    setDone(true);

    if (assignments.length > 0) {
      toast({
        title: `${assignments.length} ${assignments.length === 1 ? "course" : "courses"} scheduled manually.`,
        variant: "success",
      });
      onScheduled(assignments);
    }
  };

  const handleRetryFailed = () => {
    const failedCodes = new Set(
      submitResults.filter((r) => !r.success).map((r) => r.code),
    );
    setEntries((prev) =>
      prev.filter((entry) => failedCodes.has(entry.course.courseCode)),
    );
    setSubmitResults([]);
    setDone(false);
  };

  const successCount = submitResults.filter((r) => r.success).length;
  const failureCount = submitResults.length - successCount;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!submitting) onOpenChange(o);
      }}
    >
      <DialogContent
        className="md:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onSwipeDown={() => !submitting && onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>Schedule Courses Manually</DialogTitle>
          <DialogDescription>
            These courses could not be placed automatically. Recommended
            non-clashing Monday to Thursday slots are pre-filled where possible.
            Each course is saved as a manual override and preserved by future
            auto-generation.
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center text-center py-4">
              {failureCount === 0 ? (
                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
              ) : (
                <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
              )}
              <h3 className="text-lg font-semibold">
                {failureCount === 0
                  ? "All courses scheduled"
                  : `${successCount} scheduled, ${failureCount} failed`}
              </h3>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {submitResults.map((r) => (
                <div
                  key={r.code}
                  className={`flex items-center justify-between gap-3 rounded-lg border p-3 text-sm ${
                    r.success
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  }`}
                >
                  <span className="font-mono font-semibold text-xs">
                    {r.code}
                  </span>
                  {r.success ? (
                    <span className="text-green-700 text-xs font-medium">
                      Scheduled
                    </span>
                  ) : (
                    <span className="text-red-700 text-xs text-right">
                      {r.error}
                    </span>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              {failureCount > 0 && (
                <Button variant="outline" onClick={handleRetryFailed}>
                  Retry Failed
                </Button>
              )}
              <Button onClick={() => onOpenChange(false)}>
                {failureCount === 0 ? "Done" : "Close"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {recommendationError && (
              <ServerErrorBanner message={recommendationError} />
            )}
            {validationError && <ServerErrorBanner message={validationError} />}

            {conflictCount > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {conflictCount}{" "}
                  {conflictCount === 1 ? "course has" : "courses have"} no
                  conflict-free recommended slot. Choose a time manually for the
                  highlighted {conflictCount === 1 ? "course" : "courses"}.
                </span>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500">
                Accept, edit or clear any recommended entry.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  requestRecommendations(
                    entries.map((entry) => entry.course.courseCode),
                  )
                }
                disabled={recommending || submitting}
              >
                {recommending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Recommend Slots
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <div className="col-span-3">Course</div>
                <div className="col-span-3">Day</div>
                <div className="col-span-3">Start Time</div>
                <div className="col-span-3">End Time</div>
              </div>

              {entries.map((entry, idx) => (
                <div
                  key={entry.course.courseCode}
                  className={`rounded-xl border p-4 space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-center ${
                    entry.hasConflict
                      ? "border-amber-300 bg-amber-50/40"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="md:col-span-3 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {entry.course.courseCode}
                      </span>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${LEVEL_PILL[entry.course.level] ?? ""}`}
                      >
                        {entry.course.level.replace("LEVEL_", "")}L
                      </Badge>
                      {entry.hasConflict && (
                        <Badge className="bg-amber-100 text-amber-800 text-xs">
                          Conflict
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {entry.course.courseName}
                    </p>
                    <button
                      type="button"
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                      onClick={() => clearEntry(idx)}
                      disabled={submitting}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Clear
                    </button>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-gray-500 mb-1 block md:hidden">
                      Day
                    </label>
                    <Select
                      value={entry.dayOfWeek}
                      onValueChange={(v) => updateEntry(idx, "dayOfWeek", v)}
                      disabled={submitting}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {MANUAL_SCHEDULING_DAYS.map((d) => (
                          <SelectItem key={d} value={d}>
                            {DAY_LABELS[d]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-gray-500 mb-1 block md:hidden">
                      Start Time
                    </label>
                    <Select
                      value={entry.startTime}
                      onValueChange={(v) => updateEntry(idx, "startTime", v)}
                      disabled={!entry.dayOfWeek || submitting}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue
                          placeholder={
                            !entry.dayOfWeek ? "Pick day first" : "Start time"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {getStartTimes(entry.dayOfWeek).map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-xs font-medium text-gray-500 mb-1 block md:hidden">
                      End Time
                    </label>
                    <Select
                      value={entry.endTime}
                      onValueChange={(v) => updateEntry(idx, "endTime", v)}
                      disabled={!entry.startTime || submitting}
                    >
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue
                          placeholder={
                            !entry.startTime ? "Pick start first" : "End time"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {getEndTimes(entry.dayOfWeek, entry.startTime).map(
                          (t) => {
                            const startH = parseInt(
                              entry.startTime.split(":")[0] ?? "0",
                              10,
                            );
                            const endH = parseInt(t.split(":")[0] ?? "0", 10);
                            return (
                              <SelectItem key={t} value={t}>
                                {t} ({endH - startH}hr)
                              </SelectItem>
                            );
                          },
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || recommending || !allComplete}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Schedule ${entries.length} ${entries.length === 1 ? "Course" : "Courses"}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
