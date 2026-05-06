"use client";

import { useState } from "react";
import { DayOfWeek, Schedule } from "@/types";
import { WEEKDAYS, getDeptStyle } from "@/lib/constants";
import { Clock } from "lucide-react";

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

  if (schedules.length === 0) {
    return (
      <div className="text-center py-8">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-sm text-gray-500">No classes scheduled this week.</p>
      </div>
    );
  }

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
            No classes on {DAY_PILL_LABELS[selectedDay]}
          </p>
        ) : (
          daySchedules.map((s) => {
            const style = getDeptStyle(s.course?.departmentCode ?? "X");
            return (
              <div
                key={s.id}
                className={`rounded-xl p-4 ${style.bg} border-l-4 ${style.border} shadow-sm`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span
                    className={`text-xs font-mono font-semibold ${style.label}`}
                  >
                    {s.course?.code ?? s.courseCode}
                  </span>
                  {s.isManualOverride && (
                    <span className="text-amber-600 text-xs flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Manual
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800 truncate">
                  {s.course?.name ?? ""}
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  <span>
                    {s.startTime} – {s.endTime}
                  </span>
                </div>
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
