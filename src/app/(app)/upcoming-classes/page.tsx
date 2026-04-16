"use client";

import { useCallback, useEffect, useState } from "react";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { AcademicSession, DayOfWeek, Schedule } from "@/types";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/state/error-state";
import { CalendarDays, Clock, Download, FileText } from "lucide-react";
import { DAY_LABELS, WEEKDAYS, getDeptStyle } from "@/lib/constants";
import { exportAsPDF } from "@/lib/schedule-export";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const JS_DAY_TO_DOW: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

export default function UpcomingClassesPage() {
  const { toast } = useToast();
  const [schedulesByDay, setSchedulesByDay] = useState<
    Partial<Record<DayOfWeek, Schedule[]>>
  >({});
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageLoadReporter(loading);

  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getLecturerSchedule();
      if (res.success && res.data) {
        const data = res.data as {
          schedulesByDay: Partial<Record<DayOfWeek, Schedule[]>>;
          activeSession: AcademicSession | null;
        };
        setSchedulesByDay(data.schedulesByDay ?? {});
        setActiveSession(data.activeSession ?? null);
      } else {
        setError("Failed to load schedule");
      }
    } catch {
      setError("Failed to load schedule");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  const todayDow = JS_DAY_TO_DOW[new Date().getDay()];
  const todayIndex = WEEKDAYS.indexOf(todayDow as (typeof WEEKDAYS)[number]);
  const orderedDays: DayOfWeek[] =
    todayIndex >= 0
      ? ([
          ...WEEKDAYS.slice(todayIndex),
          ...WEEKDAYS.slice(0, todayIndex),
        ] as DayOfWeek[])
      : (WEEKDAYS as unknown as DayOfWeek[]);

  const allSchedules = Object.values(schedulesByDay).flat() as Schedule[];
  const hasSchedules = allSchedules.length > 0;

  const handleExportPDF = async () => {
    if (!hasSchedules) return;
    try {
      await exportAsPDF(allSchedules);
      toast({ title: "Schedule exported as PDF." });
    } catch {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleExportCSV = () => {
    if (!hasSchedules) return;
    const headers = [
      "Day",
      "Course Code",
      "Course Name",
      "Start Time",
      "End Time",
      "Department",
    ];
    const rows = orderedDays.flatMap((day) => {
      const daySchedules = (schedulesByDay[day] ?? []) as Schedule[];
      return [...daySchedules]
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((s) => [
          DAY_LABELS[day],
          s.course?.code ?? s.courseCode,
          s.course?.name ?? "",
          s.startTime,
          s.endTime,
          s.course?.department?.name ?? s.course?.departmentCode ?? "",
        ]);
    });
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "upcoming-classes.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Schedule exported as CSV." });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Upcoming Classes
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
              <div className="rounded-xl border border-gray-200 p-4 animate-pulse h-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Upcoming Classes
        </h1>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="schedule" onRetry={fetchSchedule} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Upcoming Classes
          </h1>
          {activeSession && (
            <p className="text-sm font-medium text-slate-500 mt-1">
              {activeSession.name}
            </p>
          )}
        </div>
        {hasSchedules && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="rounded-full">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44 rounded-xl">
              <DropdownMenuItem
                onClick={handleExportPDF}
                className="cursor-pointer py-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                PDF Document
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleExportCSV}
                className="cursor-pointer py-2"
              >
                <FileText className="h-4 w-4 mr-2" />
                CSV File
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {!hasSchedules ? (
        <div className="rounded-2xl border border-slate-200 p-12 text-center">
          <CalendarDays className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">
            No classes scheduled
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            You have no classes scheduled in the active session.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {orderedDays.map((day) => {
            const daySchedules = (
              [...(schedulesByDay[day] ?? [])] as Schedule[]
            ).sort((a, b) => a.startTime.localeCompare(b.startTime));
            if (!daySchedules.length) return null;
            const isToday = day === todayDow;
            return (
              <div key={day} className="space-y-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-base font-bold text-slate-800">
                    {DAY_LABELS[day]}
                  </h2>
                  {isToday && (
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                      Today
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {daySchedules.map((s) => {
                    const style = getDeptStyle(
                      s.course?.departmentCode ?? s.courseCode,
                    );
                    return (
                      <div
                        key={s.id}
                        className={`rounded-xl border-l-4 p-4 ${style.bg} ${style.border}`}
                      >
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                          <span className="text-xs font-medium text-gray-500">
                            {s.startTime} &ndash; {s.endTime}
                          </span>
                        </div>
                        <p
                          className={`text-base font-bold leading-tight ${style.text}`}
                        >
                          {s.course?.code ?? s.courseCode}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5 truncate">
                          {s.course?.name ?? ""}
                        </p>
                        {s.course?.department?.name && (
                          <p
                            className={`text-xs mt-1.5 font-medium ${style.label}`}
                          >
                            {s.course.department.name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
