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
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Course, DayOfWeek } from "@/types";
import {
  SLOT_MAP,
  WEDNESDAY_SLOT_MAP,
  DAY_LABELS,
  WEEKDAYS,
  LEVEL_PILL,
} from "@/lib/constants";
import { useToast } from "@/hooks/use-toast";

interface CourseScheduleEntry {
  courseCode: string;
  courseName: string;
  level: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface SubmitResult {
  code: string;
  success: boolean;
  error?: string;
}

interface UniversityCoursesScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseCodes: string[];
  onSuccess: () => void;
}

export function UniversityCoursesScheduleModal({
  open,
  onOpenChange,
  courseCodes,
  onSuccess,
}: UniversityCoursesScheduleModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState("");
  const [entries, setEntries] = useState<CourseScheduleEntry[]>([]);
  const [done, setDone] = useState(false);
  const [submitResults, setSubmitResults] = useState<SubmitResult[]>([]);

  const fetchCourses = useCallback(async () => {
    if (!courseCodes.length) return;
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiClient.getCourses({ limit: 500, isGeneral: true });
      const r = getItemsFromResponse<Course>(res);
      const found = (r?.items ?? []).filter((c) =>
        courseCodes.includes(c.code),
      );
      const missing = courseCodes.filter(
        (code) => !found.some((c) => c.code === code),
      );
      const all: CourseScheduleEntry[] = [
        ...found.map((c) => ({
          courseCode: c.code,
          courseName: c.name,
          level: c.level,
          dayOfWeek: "",
          startTime: "",
          endTime: "",
        })),
        ...missing.map((code) => ({
          courseCode: code,
          courseName: "",
          level: "",
          dayOfWeek: "",
          startTime: "",
          endTime: "",
        })),
      ];
      setEntries(all);
    } catch {
      setFetchError(
        "Failed to load course details. You can still assign slots by course code.",
      );
      setEntries(
        courseCodes.map((code) => ({
          courseCode: code,
          courseName: "",
          level: "",
          dayOfWeek: "",
          startTime: "",
          endTime: "",
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [courseCodes]);

  useEffect(() => {
    if (open) {
      setDone(false);
      setSubmitResults([]);
      setValidationError("");
      fetchCourses();
    }
  }, [open, fetchCourses]);

  const updateEntry = (
    index: number,
    field: keyof CourseScheduleEntry,
    value: string,
  ) => {
    setEntries((prev) => {
      const next = [...prev];
      const entry = { ...next[index]! };
      entry[field] = value;
      if (field === "dayOfWeek") {
        entry.startTime = "";
        entry.endTime = "";
      }
      if (field === "startTime") {
        entry.endTime = "";
      }
      next[index] = entry;
      return next;
    });
  };

  const getAvailableStartTimes = (dayOfWeek: string): string[] => {
    if (!dayOfWeek) return [];
    const map =
      dayOfWeek === DayOfWeek.WEDNESDAY ? WEDNESDAY_SLOT_MAP : SLOT_MAP;
    return Object.keys(map);
  };

  const getAvailableEndTimes = (
    dayOfWeek: string,
    startTime: string,
  ): string[] => {
    if (!dayOfWeek || !startTime) return [];
    const map =
      dayOfWeek === DayOfWeek.WEDNESDAY ? WEDNESDAY_SLOT_MAP : SLOT_MAP;
    return map[startTime] ?? [];
  };

  const allComplete =
    entries.length > 0 &&
    entries.every((e) => e.dayOfWeek && e.startTime && e.endTime);

  const handleSubmit = async () => {
    const incomplete = entries.filter(
      (e) => !e.dayOfWeek || !e.startTime || !e.endTime,
    );
    if (incomplete.length > 0) {
      setValidationError(
        `Complete all fields before submitting. ${incomplete.length} course${incomplete.length !== 1 ? "s" : ""} still need${incomplete.length === 1 ? "s" : ""} a time slot.`,
      );
      return;
    }
    setValidationError("");
    setSubmitting(true);

    const results: SubmitResult[] = [];

    for (const entry of entries) {
      try {
        const res = await apiClient.createSchedule({
          courseCode: entry.courseCode,
          dayOfWeek: entry.dayOfWeek as DayOfWeek,
          startTime: entry.startTime,
          endTime: entry.endTime,
          isFixed: true,
        });
        if (res.success) {
          results.push({ code: entry.courseCode, success: true });
        } else {
          results.push({
            code: entry.courseCode,
            success: false,
            error: (res as any).error ?? "Failed to create schedule",
          });
        }
      } catch {
        results.push({
          code: entry.courseCode,
          success: false,
          error: "Request failed",
        });
      }
    }

    setSubmitResults(results);
    setSubmitting(false);
    setDone(true);

    const successCount = results.filter((r) => r.success).length;
    if (successCount > 0) {
      toast({
        title: `${successCount} university course${successCount !== 1 ? "s" : ""} scheduled successfully.`,
      });
      onSuccess();
    }
  };

  const successCount = submitResults.filter((r) => r.success).length;
  const failureCount = submitResults.filter((r) => !r.success).length;

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
          <DialogTitle>Schedule University-Wide Courses</DialogTitle>
          <DialogDescription>
            These courses require a manually assigned time slot before
            auto-generation can proceed. Each course will be pinned to prevent
            future auto-generation from overwriting the assignment.
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
              {failureCount > 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  Review errors below. You can retry failed courses from the
                  schedule page.
                </p>
              )}
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {submitResults.map((r) => (
                <div
                  key={r.code}
                  className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
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
                    <span className="text-red-700 text-xs">{r.error}</span>
                  )}
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>
                {failureCount === 0 ? "Done" : "Close"}
              </Button>
            </DialogFooter>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            {fetchError && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                {fetchError}
              </div>
            )}
            {validationError && <ServerErrorBanner message={validationError} />}

            <div className="space-y-3">
              <div className="hidden md:grid grid-cols-12 gap-3 px-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
                <div className="col-span-3">Course</div>
                <div className="col-span-3">Day</div>
                <div className="col-span-3">Start Time</div>
                <div className="col-span-3">End Time</div>
              </div>

              {entries.map((entry, idx) => (
                <div
                  key={entry.courseCode}
                  className="rounded-xl border border-gray-200 bg-white p-4 space-y-3 md:space-y-0 md:grid md:grid-cols-12 md:gap-3 md:items-center"
                >
                  <div className="md:col-span-3 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {entry.courseCode}
                      </span>
                      {entry.level && (
                        <Badge
                          variant="secondary"
                          className={`text-xs ${LEVEL_PILL[entry.level as keyof typeof LEVEL_PILL] ?? ""}`}
                        >
                          {entry.level.replace("LEVEL_", "")}L
                        </Badge>
                      )}
                    </div>
                    {entry.courseName && (
                      <p className="text-xs text-gray-500 truncate md:hidden">
                        {entry.courseName}
                      </p>
                    )}
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
                        {WEEKDAYS.map((d) => (
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
                        {getAvailableStartTimes(entry.dayOfWeek).map((t) => (
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
                        {getAvailableEndTimes(
                          entry.dayOfWeek,
                          entry.startTime,
                        ).map((t) => {
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
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
              Each course will be pinned after scheduling. Auto-generation will
              respect these slots as occupied time and will not overwrite them.
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
                disabled={submitting || !allComplete}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Schedule ${entries.length} Course${entries.length !== 1 ? "s" : ""}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
