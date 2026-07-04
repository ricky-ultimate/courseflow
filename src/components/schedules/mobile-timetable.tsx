"use client";

import { useRef, useEffect } from "react";
import { DayOfWeek, Schedule, SessionType } from "@/types";
import {
  WEEKDAYS,
  DAY_MEDIUM_LABELS,
  TIME_SLOTS,
  getDeptStyle,
} from "@/lib/constants";
import { getStartHour } from "@/lib/utils";

export interface MobileTimetableProps {
  schedules: Schedule[];
  selectedDay: DayOfWeek;
  onDayChange: (day: DayOfWeek) => void;
  onScheduleClick: (schedule: Schedule) => void;
  onEmptySlotClick?: (day: DayOfWeek, startTime: string) => void;
  canMutate?: boolean;
}

export function MobileTimetable({
  schedules,
  selectedDay,
  onDayChange,
  onScheduleClick,
  onEmptySlotClick,
  canMutate,
}: MobileTimetableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scheduleMap = new Map<string, Schedule>();
  schedules.forEach((s) => {
    if (s.dayOfWeek === selectedDay) scheduleMap.set(s.startTime, s);
  });

  const isCoveredByEarlierSchedule = (slotTime: string): boolean => {
    const slotHour = getStartHour(slotTime);
    for (const [sStartTime, s] of Array.from(scheduleMap.entries())) {
      if (sStartTime === slotTime) continue;
      const sStartHour = getStartHour(sStartTime);
      const sEndHour = getStartHour(s.endTime);
      if (slotHour > sStartHour && slotHour < sEndHour) return true;
    }
    return false;
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.querySelector("[data-active='true']")?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });
  }, [selectedDay]);

  return (
    <div className="space-y-6">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4"
      >
        {WEEKDAYS.map((day) => (
          <button
            key={day}
            type="button"
            data-active={day === selectedDay}
            onClick={() => onDayChange(day)}
            className={`shrink-0 h-10 rounded-full px-5 font-semibold text-sm tracking-wide touch-manipulation transition-all ${
              day === selectedDay
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {DAY_MEDIUM_LABELS[day]}
          </button>
        ))}
      </div>

      <div className="relative pt-2">
        <div className="absolute left-[54px] top-4 bottom-8 w-px bg-slate-200" />

        {TIME_SLOTS.map((startTime) => {
          const s = scheduleMap.get(startTime);
          const covered = isCoveredByEarlierSchedule(startTime);

          if (s) {
            const style = getDeptStyle(
              s.course?.departmentCode ?? s.courseCode,
            );
            const startHour = getStartHour(s.startTime);
            const endHour = getStartHour(s.endTime);
            const duration = endHour - startHour;
            return (
              <div
                key={startTime}
                className="flex gap-4 relative group"
                style={{ minHeight: `${duration * 80}px` }}
              >
                <div className="w-10 shrink-0 text-right">
                  <span className="text-xs font-semibold text-slate-400 sticky top-[72px]">
                    {startTime}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onScheduleClick(s)}
                  className={`relative flex-1 mb-4 rounded-2xl p-4 text-left border-l-4 ${style.bg} ${style.border} shadow-sm touch-manipulation z-10`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className={`text-[10px] font-bold tracking-widest uppercase ${style.label}`}
                    >
                      {s.course?.departmentCode ??
                        s.courseCode?.slice(0, 3) ??
                        "—"}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      {s.sessionType === SessionType.PRACTICAL && (
                        <span
                          className="text-[9px] font-bold text-violet-600 bg-violet-100 rounded px-1"
                          title="Practical session"
                        >
                          P
                        </span>
                      )}
                      {s.isManualOverride && (
                        <span
                          className="w-2 h-2 rounded-full bg-amber-400 shrink-0"
                          title="Manual override"
                        />
                      )}
                    </span>
                  </div>
                  <div
                    className={`font-bold tracking-tight text-base leading-tight ${style.text}`}
                  >
                    {s.course?.code ?? s.courseCode}
                  </div>
                  <div className="text-sm text-slate-600/90 truncate leading-snug mt-0.5">
                    {s.course?.name ?? "—"}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-2.5">
                    {s.startTime} – {s.endTime}
                  </div>
                </button>
              </div>
            );
          }

          if (covered) return null;

          return (
            <div key={startTime} className="flex gap-4 min-h-[64px] relative">
              <div className="w-10 shrink-0 text-right">
                <span className="text-xs font-medium text-slate-400 sticky top-[72px]">
                  {startTime}
                </span>
              </div>
              <div className="absolute left-[52px] top-2 w-[5px] h-[1px] bg-slate-300" />
              <div className="flex-1 pb-4 z-10">
                {canMutate && onEmptySlotClick && (
                  <button
                    type="button"
                    onClick={() => onEmptySlotClick(selectedDay, startTime)}
                    className="w-full h-full min-h-[48px] rounded-2xl border border-dashed border-slate-300 flex items-center justify-center text-slate-400 hover:bg-slate-50 hover:text-indigo-400 hover:border-indigo-200 transition-colors touch-manipulation"
                  >
                    <span className="text-lg font-light">+</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
