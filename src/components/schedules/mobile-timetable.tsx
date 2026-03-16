'use client'

import { useRef, useEffect } from 'react'
import { DayOfWeek, Schedule } from '@/types'

const WEEKDAYS: { value: DayOfWeek; short: string }[] = [
  { value: DayOfWeek.MONDAY, short: 'MON' },
  { value: DayOfWeek.TUESDAY, short: 'TUES' },
  { value: DayOfWeek.WEDNESDAY, short: 'WED' },
  { value: DayOfWeek.THURSDAY, short: 'THU' },
  { value: DayOfWeek.FRIDAY, short: 'FRI' },
]

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'] as const

const DEPT_STYLES: { bg: string; border: string }[] = [
  { bg: 'bg-blue-100', border: 'border-l-blue-400' },
  { bg: 'bg-violet-100', border: 'border-l-violet-400' },
  { bg: 'bg-emerald-100', border: 'border-l-emerald-400' },
  { bg: 'bg-orange-100', border: 'border-l-orange-400' },
  { bg: 'bg-pink-100', border: 'border-l-pink-400' },
  { bg: 'bg-sky-100', border: 'border-l-sky-400' },
  { bg: 'bg-amber-100', border: 'border-l-amber-400' },
  { bg: 'bg-teal-100', border: 'border-l-teal-400' },
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
    <div className="space-y-4">
      <div ref={scrollRef} className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
        {WEEKDAYS.map(({ value, short }) => (
          <button
            key={value}
            type="button"
            data-active={value === selectedDay}
            onClick={() => onDayChange(value)}
            className={`shrink-0 min-w-[52px] h-9 rounded-full px-4 font-medium text-sm touch-manipulation ${
              value === selectedDay ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            {short}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {TIME_SLOTS.map((startTime) => {
          const s = scheduleMap.get(startTime)
          const prevHour = getStartHour(startTime) - 1
          const prevTime = prevHour >= 9 ? `${prevHour.toString().padStart(2, '0')}:00` : null
          const coveredByPrev = prevTime && scheduleMap.has(prevTime)
          if (s) {
            return (
              <div key={startTime} className="flex gap-3 min-h-[80px]">
                <div className="w-12 shrink-0 text-xs text-gray-400 pt-2 sticky left-0">{startTime}</div>
                <button
                  type="button"
                  onClick={() => onScheduleClick(s)}
                  className={`flex-1 min-h-[72px] rounded-lg p-3 text-left border-l-4 ${getDeptStyle(s.course?.departmentCode ?? s.courseCode).bg} ${getDeptStyle(s.course?.departmentCode ?? s.courseCode).border} touch-manipulation`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-mono text-gray-600">
                      {s.course?.departmentCode ?? s.courseCode?.slice(0, 3) ?? '—'}
                    </span>
                    <span className="flex items-center gap-1 text-[10px] text-gray-500">
                      {s.isManualOverride && (
                        <>
                          <span>Manual</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" title="Manual override" />
                        </>
                      )}
                      {s.isFixed && <span>Fixed</span>}
                    </span>
                  </div>
                  <div className="font-semibold font-mono text-sm">{s.course?.code ?? s.courseCode}</div>
                  <div className="text-xs text-gray-600 truncate">{s.course?.name ?? '—'}</div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {s.startTime} – {s.endTime}
                  </div>
                </button>
              </div>
            )
          }
          if (coveredByPrev) return null
          return (
            <div key={startTime} className="flex gap-3 min-h-[80px]">
              <div className="w-12 shrink-0 text-xs text-gray-400 pt-2 sticky left-0">{startTime}</div>
              {canMutate && onEmptySlotClick ? (
                <button
                  type="button"
                  onClick={() => onEmptySlotClick(selectedDay, startTime)}
                  className="flex-1 min-h-[72px] rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:bg-gray-50 touch-manipulation"
                >
                  +
                </button>
              ) : (
                <div className="flex-1 min-h-[72px] rounded-lg border border-dashed border-gray-200" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
