"use client";

import { DayOfWeek, Schedule } from "@/types";
import { WEEKDAYS, TIME_SLOTS, getDeptStyle } from "@/lib/constants";
import { getStartHour } from "@/lib/utils";

const DAY_TO_JS: Record<string, number> = {
  [DayOfWeek.MONDAY]: 1, [DayOfWeek.TUESDAY]: 2, [DayOfWeek.WEDNESDAY]: 3,
  [DayOfWeek.THURSDAY]: 4, [DayOfWeek.FRIDAY]: 5,
};

export interface TimetableGridProps {
  schedules: Schedule[];
  onScheduleClick: (schedule: Schedule) => void;
  onEmptyCellClick?: (day: DayOfWeek, startTime: string) => void;
  canMutate?: boolean;
}

export function TimetableGrid({ schedules, onScheduleClick, onEmptyCellClick, canMutate }: TimetableGridProps) {
  const scheduleMap = new Map<string, Schedule>();
  schedules.forEach((s) => scheduleMap.set(`${s.dayOfWeek}-${s.startTime}`, s));

  const getSchedule = (day: DayOfWeek, startTime: string) => scheduleMap.get(`${day}-${startTime}`);

  const isWednesdayCutoff = (day: DayOfWeek, startTime: string) =>
    day === DayOfWeek.WEDNESDAY && getStartHour(startTime) >= 15;

  const COL_MAP: Record<string, number> = {
    [DayOfWeek.MONDAY]: 2, [DayOfWeek.TUESDAY]: 3, [DayOfWeek.WEDNESDAY]: 4,
    [DayOfWeek.THURSDAY]: 5, [DayOfWeek.FRIDAY]: 6,
  };

  return (
    <div
      className="grid bg-slate-100 rounded-2xl overflow-hidden border border-slate-200/70 shadow-sm"
      style={{
        gridTemplateColumns: "60px repeat(5, minmax(0, 1fr))",
        gridTemplateRows: "48px repeat(10, minmax(68px, auto))",
        gap: "1px",
      }}
    >
      <div className="bg-white/80 backdrop-blur-sm" style={{ gridColumn: 1, gridRow: 1 }} />

      {WEEKDAYS.map((day, i) => {
        const today = new Date();
        const jsDay = today.getDay();
        const isToday = DAY_TO_JS[day] === (jsDay === 0 ? 7 : jsDay);
        const monOffset = jsDay === 0 ? 6 : jsDay - 1;
        const dateNum = today.getDate() - monOffset + ((DAY_TO_JS[day] ?? 1) - 1);
        return (
          <div
            key={day}
            className="bg-white/90 backdrop-blur-md px-2 py-2 flex flex-col items-center justify-center gap-0.5 sticky top-0 z-20"
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{day.replace("DAY", "")}</span>
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-sm font-semibold ${isToday ? "bg-indigo-600 text-white" : "text-slate-800"}`}>
              {dateNum}
            </span>
          </div>
        );
      })}

      {TIME_SLOTS.map((startTime, rowIdx) => (
        <div
          key={`time-${startTime}`}
          className="bg-white/60 px-2 flex items-start justify-end text-[11px] font-medium text-slate-400 sticky left-0 z-10 pt-1.5"
          style={{ gridColumn: 1, gridRow: rowIdx + 2 }}
        >
          {startTime}
        </div>
      ))}

      {schedules
        .filter((s) => WEEKDAYS.includes(s.dayOfWeek as (typeof WEEKDAYS)[number]))
        .map((s) => {
          const startHour = getStartHour(s.startTime);
          const rowStart = startHour - 9 + 2;
          const col = COL_MAP[s.dayOfWeek];
          if (!col || rowStart < 2 || rowStart > 11) return null;
          const style = getDeptStyle(s.course?.departmentCode ?? s.courseCode);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onScheduleClick(s)}
              title={s.course?.name}
              className={`m-[2px] rounded-lg px-2.5 py-2 text-left overflow-hidden cursor-pointer transition-all touch-manipulation border-l-4 ${style.bg} ${style.border}`}
              style={{ gridColumn: col, gridRow: `${rowStart} / span 2`, minHeight: 130 }}
            >
              <div className="flex items-start justify-between gap-1 mb-1">
                <span className={`text-[10px] font-bold tracking-widest uppercase ${style.label}`}>
                  {s.course?.departmentCode ?? s.courseCode?.slice(0, 3) ?? "—"}
                </span>
                <span className="flex gap-1 shrink-0">
                  {s.isFixed && <Lock className="h-3 w-3 text-slate-500" />}
                  {s.isManualOverride && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-0.5" title="Manual override" />}
                </span>
              </div>
              <div className={`text-sm font-bold tracking-tight leading-tight truncate ${style.text}`}>
                {s.course?.code ?? s.courseCode}
              </div>
              <div className="text-xs text-slate-600/90 truncate leading-snug mt-0.5">{s.course?.name ?? "—"}</div>
              <div className="text-[10px] font-medium text-slate-500 mt-2 tracking-wide">
                {s.startTime} – {s.endTime}
              </div>
            </button>
          );
        })}

      {TIME_SLOTS.map((startTime, rowIdx) =>
        WEEKDAYS.map((day, colIdx) => {
          const s = getSchedule(day, startTime);
          const prevHour = getStartHour(startTime) - 1;
          const prevTime = prevHour >= 9 ? `${prevHour.toString().padStart(2, "0")}:00` : null;
          const coveredByPrev = prevTime && getSchedule(day, prevTime);
          const isCutoff = isWednesdayCutoff(day, startTime);
          if (s || coveredByPrev) return null;

          return (
            <div
              key={`cell-${day}-${startTime}`}
              className={`group relative ${isCutoff ? "" : "bg-white"}`}
              style={{
                gridColumn: colIdx + 2,
                gridRow: rowIdx + 2,
                ...(isCutoff && {
                  background: "repeating-linear-gradient(-45deg, #f8fafc, #f8fafc 4px, #f1f5f9 4px, #f1f5f9 8px)",
                }),
              }}
              title={isCutoff ? "Wednesday classes end at 15:00." : undefined}
            >
              {canMutate && !isCutoff && (
                <button
                  type="button"
                  onClick={() => onEmptyCellClick?.(day, startTime)}
                  className="w-full h-full min-h-[64px] flex items-center justify-center border border-transparent group-hover:border-slate-200 group-hover:bg-slate-50/50 transition-all touch-manipulation"
                >
                  <span className="text-transparent group-hover:text-indigo-400 text-lg font-light transition-colors">+</span>
                </button>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

import { Lock } from "lucide-react";
