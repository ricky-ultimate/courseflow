'use client'

import { Sheet, SheetContent, SheetHeader } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Lock, ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Schedule, Semester, DayOfWeek } from '@/types'

const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Monday',
  [DayOfWeek.TUESDAY]: 'Tuesday',
  [DayOfWeek.WEDNESDAY]: 'Wednesday',
  [DayOfWeek.THURSDAY]: 'Thursday',
  [DayOfWeek.FRIDAY]: 'Friday',
  [DayOfWeek.SATURDAY]: 'Saturday',
  [DayOfWeek.SUNDAY]: 'Sunday',
}

export interface ScheduleDetailSheetProps {
  schedule: Schedule | null
  sessionName?: string
  onClose: () => void
  onEdit: (schedule: Schedule) => void
  onDelete: (schedule: Schedule) => void
  canMutate?: boolean
  isAdmin?: boolean
}

export function ScheduleDetailSheet({
  schedule,
  sessionName,
  onClose,
  onEdit,
  onDelete,
  canMutate,
  isAdmin,
}: ScheduleDetailSheetProps) {
  if (!schedule) return null

  const canDelete = canMutate && (schedule.isFixed ? !!isAdmin : true)

  return (
    <Sheet open={!!schedule} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" className="w-full max-sm:h-full sm:max-w-[420px] overflow-y-auto" hideCloseOnMobile>
        <SheetHeader className="md:sr-only">
          <Button variant="ghost" size="icon" className="md:hidden absolute left-4 top-4 z-10" onClick={onClose}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </SheetHeader>
        <div className="pt-12 md:pt-0 space-y-6">
          <div>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {schedule.course?.code ?? schedule.courseCode}
            </span>
            <h2 className="text-xl font-semibold mt-2">{schedule.course?.name ?? '—'}</h2>
          </div>

          <div>
            <p className="text-lg font-semibold">
              {DAY_LABELS[schedule.dayOfWeek as DayOfWeek] ?? schedule.dayOfWeek}, {schedule.startTime} – {schedule.endTime}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {sessionName || schedule.sessionId} · {schedule.semester === Semester.FIRST ? 'First' : 'Second'} Semester
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {schedule.isFixed ? (
              <Badge className="bg-indigo-100 text-indigo-700">
                <Lock className="h-3 w-3 mr-1" />
                Fixed
              </Badge>
            ) : schedule.isManualOverride ? (
              <Badge className="bg-amber-100 text-amber-700">Manual Override</Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">Auto-generated</Badge>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm">
              <span className="text-gray-500">Level:</span>{' '}
              <Badge variant="secondary" className="text-xs">
                {schedule.course?.level?.replace('LEVEL_', '') ?? '—'}
              </Badge>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Department:</span>{' '}
              <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{schedule.course?.departmentCode ?? '—'}</span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Lecturer:</span>{' '}
              {schedule.course?.lecturer?.name && schedule.course?.lecturer?.email
                ? `${schedule.course.lecturer.name} (${schedule.course.lecturer.email})`
                : schedule.course?.lecturer?.name ?? schedule.course?.lecturer?.email ?? '—'}
            </p>
          </div>

          {canMutate && (
            <div className="space-y-2">
              <Button variant="outline" className="w-full" onClick={() => onEdit(schedule)}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit Schedule
              </Button>
              <span title={!canDelete && schedule.isFixed ? 'This slot is fixed. Contact an admin to remove it.' : undefined} className="block">
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onDelete(schedule)}
                  disabled={!canDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Schedule
                </Button>
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
