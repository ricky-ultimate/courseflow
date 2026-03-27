"use client";

import { DayOfWeek, Schedule } from "@/types";
import { DAY_LABELS } from "@/lib/constants";

const WEEKDAYS_ORDER = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

interface ScheduleAgendaViewProps {
  schedules: Schedule[];
  onScheduleClick: (s: Schedule) => void;
}

export function ScheduleAgendaView({
  schedules,
  onScheduleClick,
}: ScheduleAgendaViewProps) {
  const groupedSchedules = WEEKDAYS_ORDER.map((day) => ({
    day,
    schedules: schedules
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((g) => g.schedules.length > 0);

  return (
    <div className="space-y-10">
      {groupedSchedules.map(({ day, schedules: daySchedules }) => (
        <div key={day} className="space-y-4">
          <div className="sticky top-[56px] z-20 bg-gray-50/95 backdrop-blur-sm py-3 border-b border-slate-200/60">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              {DAY_LABELS[day]}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {daySchedules.map((s) => (
              <div
                key={s.id}
                onClick={() => onScheduleClick(s)}
                className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden"
              >
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-2xl opacity-80" />
                <div className="flex justify-between items-start mb-3 pl-2">
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {s.startTime} – {s.endTime}
                  </span>
                  {s.isManualOverride && (
                    <div className="h-2 w-2 rounded-full bg-amber-400 mt-1" />
                  )}
                </div>
                <div className="pl-2">
                  <h3 className="font-bold text-slate-900 text-lg leading-tight tracking-tight mb-1">
                    {s.course?.code ?? s.courseCode}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-1 mb-4">
                    {s.course?.name ?? "—"}
                  </p>
                  <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                    <span className="uppercase tracking-wider">
                      {s.course?.departmentCode ?? "—"}
                    </span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    <span>
                      {s.course?.level?.replace("LEVEL_", "") ?? "—"} Lvl
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
