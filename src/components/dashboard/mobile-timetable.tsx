"use client";

import { useState } from "react";
import { DayOfWeek, Schedule } from "@/types";
import {
  WEEKDAYS,
  getDeptStyle,
} from "@/lib/constants";

const JS_DAY_TO_DOW: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const DAY_PILL_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "MON",
  [DayOfWeek.TUESDAY]: "TUE",
  [DayOfWeek.WEDNESDAY]: "WED",
  [DayOfWeek.THURSDAY]: "THU",
  [DayOfWeek.FRIDAY]: "FRI",
  [DayOfWeek.SATURDAY]: "SAT",
  [DayOfWeek.SUNDAY]: "SUN",
};

export function DashboardMobileTimetable({
  schedules,
}: {
  schedules: Schedule[];
}) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.MONDAY);

  const daySchedules = schedules
    .filter((s) => s.dayOfWeek === selectedDay)
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto py-2 -mx-1">
        {WEEKDAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDay(d)}
            className={`min-w-[52px] min-h-[44px] h-11 rounded-full px-3 text-sm font-medium shrink-0 touch-manipulation ${
              selectedDay === d
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {DAY_PILL_LABELS[d]}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {daySchedules.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">
            No classes this day
          </p>
        ) : (
          daySchedules.map((s) => {
            const style = getDeptStyle(s.course?.departmentCode ?? "X");
            return (
              <div
                key={s.id}
                className={`rounded-lg p-3 min-h-[72px] ${style.bg} border-l-4 ${style.border}`}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-mono ${style.label}`}>
                    {s.course?.departmentCode ?? "—"}
                  </span>
                  {s.isManualOverride && (
                    <span className="text-amber-600 text-xs">●</span>
                  )}
                </div>
                <p className={`font-mono text-sm font-semibold ${style.text}`}>
                  {s.course?.code ?? s.courseCode}
                </p>
                <p className="text-xs text-gray-600 truncate">
                  {s.course?.name ?? ""}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {s.startTime} – {s.endTime}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function getNextClassToday(schedules: Schedule[]): string {
  const now = new Date();
  const today = JS_DAY_TO_DOW[now.getDay()];
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const todaySchedules = schedules
    .filter((s) => s.dayOfWeek === today && s.startTime)
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  const next = todaySchedules.find((s) => (s.startTime || "") > nowStr);
  if (next) {
    const code = next.course?.code ?? next.courseCode;
    return `${next.startTime} — ${code}`;
  }
  return "—";
}
