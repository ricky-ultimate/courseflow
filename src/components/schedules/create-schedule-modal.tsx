'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ServerErrorBanner } from '@/components/ui/server-error-banner'
import { Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Course, DayOfWeek, Schedule } from '@/types'

const scheduleModalSchema = z.object({
  courseCode: z.string().min(1, 'Course is required'),
  dayOfWeek: z.string().min(1, 'Day of week is required'),
  startTime: z.string().min(1, 'Start time is required'),
  isFixed: z.boolean(),
}).superRefine((data, ctx) => {
  if (data.dayOfWeek === DayOfWeek.WEDNESDAY && data.startTime) {
    const hour = parseInt(data.startTime.split(':')[0] ?? '0', 10)
    if (hour >= 14) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Wednesday classes must end by 15:00.', path: ['startTime'] })
    }
  }
})

type ScheduleModalFormValues = z.infer<typeof scheduleModalSchema>

const WEEKDAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY]
const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: 'Monday',
  [DayOfWeek.TUESDAY]: 'Tuesday',
  [DayOfWeek.WEDNESDAY]: 'Wednesday',
  [DayOfWeek.THURSDAY]: 'Thursday',
  [DayOfWeek.FRIDAY]: 'Friday',
  [DayOfWeek.SATURDAY]: 'Saturday',
  [DayOfWeek.SUNDAY]: 'Sunday',
}

const START_TIMES_BASE = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const WEDNESDAY_START_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00']

export interface CreateScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  prefill?: { courseCode?: string; dayOfWeek?: DayOfWeek; startTime?: string }
  editSchedule?: Schedule | null
  /** When creating: if course already has a schedule in this session, show inline note */
  activeSessionId?: string
  existingSchedules?: Schedule[]
}

export function CreateScheduleModal({
  open,
  onOpenChange,
  onSuccess,
  prefill = {},
  editSchedule,
  activeSessionId,
  existingSchedules = [],
}: CreateScheduleModalProps) {
  const isEdit = !!editSchedule
  const { toast } = useToast()
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  const [query, setQuery] = useState('')
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const form = useForm<ScheduleModalFormValues>({
    resolver: zodResolver(scheduleModalSchema),
    mode: 'onBlur',
    defaultValues: {
      courseCode: '',
      dayOfWeek: '',
      startTime: '',
      isFixed: false,
    },
  })

  const fetchCourses = useCallback(async () => {
    try {
      const res = await apiClient.getCourses({ limit: 200 })
      const r = getItemsFromResponse<Course>(res)
      if (r) setCourses(r.items)
    } catch {
      setCourses([])
    }
  }, [])

  useEffect(() => {
    if (open) fetchCourses()
  }, [open, fetchCourses])

  useEffect(() => {
    if (open && editSchedule) {
      form.reset({
        courseCode: editSchedule.courseCode,
        dayOfWeek: editSchedule.dayOfWeek,
        startTime: editSchedule.startTime,
        isFixed: editSchedule.isFixed ?? false,
      })
    } else if (open && (prefill.courseCode || prefill.dayOfWeek || prefill.startTime)) {
      form.reset({
        courseCode: prefill.courseCode ?? '',
        dayOfWeek: prefill.dayOfWeek ?? '',
        startTime: prefill.startTime ?? '',
        isFixed: false,
      })
    }
  }, [open, editSchedule, prefill.courseCode, prefill.dayOfWeek, prefill.startTime, form])

  const dayOfWeek = form.watch('dayOfWeek')
  const startTime = form.watch('startTime')
  const startTimeOptions = dayOfWeek === DayOfWeek.WEDNESDAY ? WEDNESDAY_START_TIMES : START_TIMES_BASE
  const endTime = startTime
    ? `${(parseInt(startTime.split(':')[0] ?? '9') + 2).toString().padStart(2, '0')}:00`
    : ''

  const wednesdayError =
    dayOfWeek === DayOfWeek.WEDNESDAY &&
    startTime &&
    parseInt(startTime.split(':')[0] ?? '0') >= 14

  const filteredCourses = query.trim().length >= 1
    ? courses.filter((c) => {
        const q = query.toLowerCase()
        return (c.code ?? '').toLowerCase().includes(q) || (c.name ?? '').toLowerCase().includes(q)
      })
    : courses.slice(0, 30)

  const courseCode = form.watch('courseCode')
  const selectedCourse = courses.find((c) => c.code === courseCode)
  const displayValue = comboboxOpen ? query : (selectedCourse ? `${selectedCourse.code} - ${selectedCourse.name}` : '')

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError('')
    try {
      setLoading(true)
      const endTimeVal = data.startTime
        ? `${(parseInt(data.startTime.split(':')[0] ?? '9') + 2).toString().padStart(2, '0')}:00`
        : ''
      if (isEdit && editSchedule) {
        const res = await apiClient.updateSchedule(editSchedule.id, {
          dayOfWeek: data.dayOfWeek as DayOfWeek,
          startTime: data.startTime,
          endTime: endTimeVal,
          isFixed: data.isFixed,
        })
        if (res.success) {
          toast({ title: 'Schedule updated.' })
          onOpenChange(false)
          form.reset({ courseCode: '', dayOfWeek: '', startTime: '', isFixed: false })
          setQuery('')
          onSuccess?.()
        } else {
          setServerError((res as { error?: string }).error ?? 'Failed to update')
        }
      } else {
        const res = await apiClient.createSchedule({
          courseCode: data.courseCode,
          dayOfWeek: data.dayOfWeek as DayOfWeek,
          startTime: data.startTime,
          endTime: endTimeVal,
          isFixed: data.isFixed,
        })
        if (res.success) {
          toast({ title: 'Schedule created.' })
          onOpenChange(false)
          form.reset({ courseCode: '', dayOfWeek: '', startTime: '', isFixed: false })
          setQuery('')
          onSuccess?.()
        } else {
          setServerError((res as { error?: string }).error ?? 'Failed to create')
        }
      }
    } catch {
      setServerError(isEdit ? 'Failed to update schedule' : 'Failed to create schedule')
    } finally {
      setLoading(false)
    }
  })

  const handleClose = () => {
    form.reset({ courseCode: '', dayOfWeek: '', startTime: '', isFixed: false })
    setQuery('')
    setComboboxOpen(false)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="md:max-w-[480px]" onSwipeDown={handleClose}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Schedule' : 'Create Schedule'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the schedule details.' : 'Add a manual schedule to the timetable.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
        <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
          {serverError && <ServerErrorBanner message={serverError} />}
          <FormField
            control={form.control}
            name="courseCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Course *</FormLabel>
                <FormControl>
                  <div ref={containerRef} className="relative">
                    <Input
                      placeholder="Search by code or name..."
                      value={displayValue}
                      onChange={(e) => {
                        setQuery(e.target.value)
                        setComboboxOpen(true)
                      }}
                      onFocus={() => setComboboxOpen(true)}
                      onKeyDown={(e) => e.key === 'Escape' && setComboboxOpen(false)}
                      disabled={loading || isEdit}
                      className={isEdit ? 'bg-gray-50 cursor-not-allowed' : ''}
                    />
                    {comboboxOpen && (
                      <>
                        <div className="fixed inset-0 z-40" aria-hidden onClick={() => setComboboxOpen(false)} />
                        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg max-h-48 overflow-y-auto">
                          {filteredCourses.length === 0 ? (
                            <div className="px-3 py-6 text-center text-sm text-gray-500">No matches</div>
                          ) : (
                            filteredCourses.map((c) => (
                              <button
                                key={c.code}
                                type="button"
                                className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                                onClick={() => {
                                  field.onChange(c.code)
                                  setQuery('')
                                  setComboboxOpen(false)
                                }}
                              >
                                <span className="font-mono text-xs">{c.code}</span>
                                <span className="text-gray-600 truncate">{c.name}</span>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dayOfWeek"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Day of week *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {WEEKDAYS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {DAY_LABELS[d]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start time *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {startTimeOptions.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-2">
            <Label>End time (auto-calculated)</Label>
            <Input value={endTime} readOnly className="bg-gray-50 cursor-not-allowed" />
          </div>

          {!isEdit && courseCode && activeSessionId && existingSchedules.some(
            (s) => s.courseCode === courseCode && s.sessionId === activeSessionId
          ) && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              This course already has a schedule. Editing will update the existing one.
            </p>
          )}

          <FormField
            control={form.control}
            name="isFixed"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center gap-2">
                <FormControl>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="rounded border-gray-300"
                    disabled={loading}
                  />
                </FormControl>
                <FormLabel className="cursor-pointer text-sm font-normal">
                  Pin this slot (isFixed) — Fix this slot so auto-generation never moves it.
                </FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !!wednesdayError}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : isEdit ? "Save Changes" : "Create Schedule"}
            </Button>
          </DialogFooter>
        </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
