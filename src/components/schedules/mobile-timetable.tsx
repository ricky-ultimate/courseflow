'use client'

import { useRef, useEffect } from 'react'
import { DayOfWeek, Schedule } from '@/types'

const WEEKDAYS: { value: DayOfWeek; short: string }[] =[
  { value: DayOfWeek.MONDAY, short: 'Mon' },
  { value: DayOfWeek.TUESDAY, short: 'Tue' },
  { value: DayOfWeek.WEDNESDAY, short: 'Wed' },
  { value: DayOfWeek.THURSDAY, short: 'Thu' },
  { value: DayOfWeek.FRIDAY, short: 'Fri' },
]

const TIME_SLOTS =['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] as const

const DEPT_STYLES: { bg: string; border: string; text: string; label: string }[] =[
  { bg: 'bg-blue-50/90', border: 'border-l-blue-500', text: 'text-blue-900', label: 'text-blue-600' },
  { bg: 'bg-indigo-50/90', border: 'border-l-indigo-500', text: 'text-indigo-900', label: 'text-indigo-600' },
  { bg: 'bg-rose-50/90', border: 'border-l-rose-500', text: 'text-rose-900', label: 'text-rose-600' },
  { bg: 'bg-emerald-50/90', border: 'border-l-emerald-500', text: 'text-emerald-900', label: 'text-emerald-600' },
  { bg: 'bg-amber-50/90', border: 'border-l-amber-500', text: 'text-amber-900', label: 'text-amber-600' },
  { bg: 'bg-purple-50/90', border: 'border-l-purple-500', text: 'text-purple-900', label: 'text-purple-600' },
  { bg: 'bg-cyan-50/90', border: 'border-l-cyan-500', text: 'text-cyan-900', label: 'text-cyan-600' },
  { bg: 'bg-fuchsia-50/90', border: 'border-l-fuchsia-500', text: 'text-fuchsia-900', label: 'text-fuchsia-600' },
]

function getDeptStyle(deptCode: string) {
  const sum = (deptCode || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return DEPT_STYLES[Math.abs(sum) % 8] ?? DEPT_STYLES[0]!
}

function getStartHour(time: string): number {
  const [h] = time.split(':')
  return parseInt(h ?? '9', 10)
}

export interface MobileTimetableProps {
  schedules: Schedule[]
  selectedDay: DayOfWeek
  onDayChange: (day: DayOfWeek) => void
  onScheduleClick: (schedule: Schedule) => void
  onEmptySlotClick?: (day: DayOfWeek, startTime: string) => void
  canMutate?: boolean
}

export function MobileTimetable({
  schedules,
  selectedDay,
  onDayChange,
  onScheduleClick,
  onEmptySlotClick,
  canMutate,
}: MobileTimetableProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scheduleMap = new Map<string, Schedule>()
  schedules.forEach((s) => {
    if (s.dayOfWeek === selectedDay) {
      scheduleMap.set(s.startTime, s)
    }
  })

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const active = el.querySelector('[data-active="true"]')
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [selectedDay])

  return (
    <div className="space-y-6">
      {/* Sleek pill scroller */}
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-4 px-4">
        {WEEKDAYS.map(({ value, short }) => (
          <button
            key={value}
            type="button"
            data-active={value === selectedDay}
            onClick={() => onDayChange(value)}
            className={`shrink-0 h-10 rounded-full px-5 font-semibold text-sm tracking-wide touch-manipulation transition-all ${
              value === selectedDay ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {short}
          </button>
        ))}
      </div>

      {/* Vertical Timeline */}
      <div className="relative pt-2">
        {/* Timeline structural line running down the left */}
        <div className="absolute left-[54px] top-4 bottom-8 w-px bg-slate-200" />

        {TIME_SLOTS.map((startTime) => {
          const s = scheduleMap.get(startTime)
          const prevHour = getStartHour(startTime) - 1
          const prevTime = prevHour >= 9 ? `${prevHour.toString().padStart(2, '0')}:00` : null
          const coveredByPrev = prevTime && scheduleMap.has(prevTime)

          if (s) {
            const style = getDeptStyle(s.course?.departmentCode ?? s.courseCode)
            return (
              <div key={startTime} className="flex gap-4 min-h-[96px] relative group">
                <div className="w-10 shrink-0 text-right">
                   <span className="text-xs font-semibold text-slate-400 sticky top-[72px]">{startTime}</span>
                </div>

                <button
                  type="button"
                  onClick={() => onScheduleClick(s)}
                  className={`relative flex-1 mb-4 min-h-[80px] rounded-2xl p-4 text-left border-l-4 ${style.bg} ${style.border} shadow-sm touch-manipulation z-10`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${style.label}`}>
                      {s.course?.departmentCode ?? s.courseCode?.slice(0, 3) ?? '—'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-slate-500">
                      {s.isManualOverride && <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" title="Manual override" />}
                      {s.isFixed && <span>🔒</span>}
                    </span>
                  </div>
                  <div className={`font-bold tracking-tight text-base leading-tight ${style.text}`}>{s.course?.code ?? s.courseCode}</div>
                  <div className="text-sm text-slate-600/90 truncate leading-snug mt-0.5">{s.course?.name ?? '—'}</div>
                  <div className="text-[11px] font-medium text-slate-500 mt-2.5">
                    {s.startTime} – {s.endTime}
                  </div>
                </button>
              </div>
            )
          }

          if (coveredByPrev) return null

          return (
            <div key={startTime} className="flex gap-4 min-h-[64px] relative">
              <div className="w-10 shrink-0 text-right">
                 <span className="text-xs font-medium text-slate-400 sticky top-[72px]">{startTime}</span>
              </div>
              {/* Timeline marker notch */}
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
          )
        })}
      </div>
    </div>
  )
}
