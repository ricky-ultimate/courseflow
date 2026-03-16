'use client'

import { DayOfWeek, Schedule } from '@/types'

const WEEKDAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY] as const

const DAY_TO_JS: Record<string, number> = {
  [DayOfWeek.MONDAY]: 1,
  [DayOfWeek.TUESDAY]: 2,
  [DayOfWeek.WEDNESDAY]: 3,
  [DayOfWeek.THURSDAY]: 4,
  [DayOfWeek.FRIDAY]: 5,
}
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

export interface TimetableGridProps {
  schedules: Schedule[]
  onScheduleClick: (schedule: Schedule) => void
  onEmptyCellClick?: (day: DayOfWeek, startTime: string) => void
  canMutate?: boolean
}

export function TimetableGrid({ schedules, onScheduleClick, onEmptyCellClick, canMutate }: TimetableGridProps) {
  const scheduleMap = new Map<string, Schedule>()
  schedules.forEach((s) => {
    const key = `${s.dayOfWeek}-${s.startTime}`
    scheduleMap.set(key, s)
  })

  const getSchedule = (day: DayOfWeek, startTime: string) => scheduleMap.get(`${day}-${startTime}`)

  const isWednesdayCutoff = (day: DayOfWeek, startTime: string) => {
    if (day !== DayOfWeek.WEDNESDAY) return false
    const hour = getStartHour(startTime)
    return hour >= 15
  }

  const COL_MAP: Record<string, number> = {
    [DayOfWeek.MONDAY]: 2,
    [DayOfWeek.TUESDAY]: 3,
    [DayOfWeek.WEDNESDAY]: 4,
    [DayOfWeek.THURSDAY]: 5,
    [DayOfWeek.FRIDAY]: 6,
  }

  return (
    <div
      className="grid gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200"
      style={{
        gridTemplateColumns: '64px repeat(5, 1fr)',
        gridTemplateRows: '40px repeat(10, 60px)',
      }}
    >
      {/* Header row */}
      <div className="bg-gray-100" style={{ gridColumn: 1, gridRow: 1 }} />
      {WEEKDAYS.map((day, i) => {
        const today = new Date()
        const jsDay = today.getDay()
        const isToday = DAY_TO_JS[day] === (jsDay === 0 ? 7 : jsDay)
        const monOffset = jsDay === 0 ? 6 : jsDay - 1
        const dateNum = today.getDate() - monOffset + ((DAY_TO_JS[day] ?? 1) - 1)
        return (
          <div
            key={day}
            className={`bg-gray-50 px-2 py-2 text-sm font-semibold text-gray-700 flex flex-col items-center justify-center gap-0.5 sticky top-0 z-20 ${
              day === DayOfWeek.WEDNESDAY ? 'bg-amber-50' : ''
            }`}
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            <span>{day.replace('DAY', '')}</span>
            {isToday && (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-semibold text-white">
                {dateNum}
              </span>
            )}
          </div>
        )
      })}

      {/* Time labels */}
      {TIME_SLOTS.map((startTime, rowIdx) => (
        <div
          key={`time-${startTime}`}
          className="bg-gray-50 px-2 flex items-center justify-end text-[13px] text-gray-400 sticky left-0 z-10"
          style={{ gridColumn: 1, gridRow: rowIdx + 2 }}
        >
          {startTime}
        </div>
      ))}

      {/* Schedule blocks (each spans 2 rows) */}
      {schedules
        .filter((s) => WEEKDAYS.includes(s.dayOfWeek as (typeof WEEKDAYS)[number]))
        .map((s) => {
          const startHour = getStartHour(s.startTime)
          const rowStart = startHour - 9 + 2
          const col = COL_MAP[s.dayOfWeek]
          if (!col || rowStart < 2 || rowStart > 11) return null
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onScheduleClick(s)}
              title={s.course?.name}
              className={`rounded-lg px-2.5 py-2 text-left overflow-hidden hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] cursor-pointer transition-shadow touch-manipulation border-l-[3px] ${getDeptStyle(s.course?.departmentCode ?? s.courseCode).bg} ${getDeptStyle(s.course?.departmentCode ?? s.courseCode).border}`}
              style={{
                gridColumn: col,
                gridRow: `${rowStart} / span 2`,
                minHeight: 118,
              }}
            >
              <div className="flex items-start justify-between gap-1 mb-0.5">
                <span className="text-[10px] font-mono text-gray-600">
                  {s.course?.departmentCode ?? s.courseCode?.slice(0, 3) ?? '—'}
                </span>
                <span className="flex gap-0.5 shrink-0">
                  {s.isFixed && <span className="text-[10px]" title="Fixed">🔒</span>}
                  {s.isManualOverride && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-0.5" title="Manual override" />}
                </span>
              </div>
              <div className="text-xs font-semibold font-mono text-gray-900 truncate">
                {s.course?.code ?? s.courseCode}
              </div>
              <div className="text-[11px] text-gray-600 truncate">{s.course?.name ?? '—'}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">
                {s.startTime} – {s.endTime}
              </div>
            </button>
          )
        })}

      {/* Empty cells and Wednesday cutoff backgrounds - only for "start" rows (no schedule covers this slot) */}
      {TIME_SLOTS.map((startTime, rowIdx) =>
        WEEKDAYS.map((day, colIdx) => {
          const s = getSchedule(day, startTime)
          const prevHour = getStartHour(startTime) - 1
          const prevTime = prevHour >= 9 ? `${prevHour.toString().padStart(2, '0')}:00` : null
          const coveredByPrev = prevTime && getSchedule(day, prevTime)
          const isCutoff = isWednesdayCutoff(day, startTime)
          if (s || coveredByPrev) return null
          return (
            <div
              key={`cell-${day}-${startTime}`}
              className={`group relative ${isCutoff ? '' : 'bg-white'}`}
              style={{
                gridColumn: colIdx + 2,
                gridRow: rowIdx + 2,
                ...(isCutoff && {
                  background: 'repeating-linear-gradient(-45deg, #f3f4f6, #f3f4f6 4px, #f9fafb 4px, #f9fafb 8px)',
                }),
              }}
              title={isCutoff ? 'Wednesday classes end at 15:00.' : undefined}
            >
              {canMutate && (
                <button
                  type="button"
                  onClick={() => onEmptyCellClick?.(day, startTime)}
                  className="w-full h-full min-h-[59px] flex items-center justify-center rounded border border-transparent group-hover:border-dashed group-hover:border-gray-300 group-hover:bg-gray-50/50 transition-colors touch-manipulation"
                >
                  <span className="text-transparent group-hover:text-gray-400 text-lg transition-colors">+</span>
                </button>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
