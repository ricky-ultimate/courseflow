'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ServerErrorBanner } from '@/components/ui/server-error-banner'
import { useAuth } from '@/contexts/AuthContext'
import { usePageLoadReporter } from '@/contexts/PageLoadContext'
import { useToast } from '@/hooks/use-toast'
import { Calendar, ArrowLeft, Loader2 } from 'lucide-react'
import { ErrorState } from '@/components/state/error-state'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Course, DayOfWeek } from '@/types'

const createScheduleSchema = z.object({
  courseCode: z.string().min(1, 'Course is required'),
  dayOfWeek: z.string().min(1, 'Day of week is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
}).refine((data) => {
  if (!data.startTime || !data.endTime) return true
  const start = new Date(`2000-01-01T${data.startTime}:00`)
  const end = new Date(`2000-01-01T${data.endTime}:00`)
  return end > start
}, { message: 'End time must be after start time', path: ['endTime'] })

type CreateScheduleFormValues = z.infer<typeof createScheduleSchema>

export default function CreateSchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isAdmin, isLecturer, isHod } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [serverError, setServerError] = useState('')
  const [isFixed, setIsFixed] = useState(false)
  usePageLoadReporter(loadingData)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [courses, setCourses] = useState<Course[]>([])

  const form = useForm<CreateScheduleFormValues>({
    resolver: zodResolver(createScheduleSchema),
    mode: 'onBlur',
    defaultValues: {
      courseCode: '',
      dayOfWeek: '',
      startTime: '',
      endTime: '',
    },
  })

  const canCreate = isAdmin || isHod /* LECTURER is read-only per 0.1 */

  const dayOptions = [
    { value: DayOfWeek.MONDAY, label: 'Monday' },
    { value: DayOfWeek.TUESDAY, label: 'Tuesday' },
    { value: DayOfWeek.WEDNESDAY, label: 'Wednesday' },
    { value: DayOfWeek.THURSDAY, label: 'Thursday' },
    { value: DayOfWeek.FRIDAY, label: 'Friday' },
    { value: DayOfWeek.SATURDAY, label: 'Saturday' },
    { value: DayOfWeek.SUNDAY, label: 'Sunday' },
  ]

  const fetchCourses = useCallback(async () => {
    setFetchError(null)
    setLoadingData(true)
    try {
      const response = await apiClient.getCourses({ limit: 100 })
      const result = getItemsFromResponse<Course>(response)
      if (result) setCourses(result.items)
    } catch {
      setFetchError('Failed to load courses')
    } finally {
      setLoadingData(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !canCreate) {
      router.replace(!isAuthenticated ? '/login' : '/dashboard')
      return
    }
    fetchCourses()
  }, [isAuthenticated, canCreate, router, fetchCourses])

  const courseFromQuery = searchParams.get('course')
  useEffect(() => {
    if (courseFromQuery && isAuthenticated && canCreate) {
      router.replace(`/schedules?create=1&course=${encodeURIComponent(courseFromQuery)}`)
    }
  }, [courseFromQuery, isAuthenticated, canCreate, router])

  if (!isAuthenticated || !canCreate) {
    return null
  }

  if (courseFromQuery) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-pulse text-gray-500">Redirecting...</div></div>
  }

  if (fetchError && !loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <ErrorState entity="courses" onRetry={fetchCourses} />
      </div>
    )
  }

  if (loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError('')
    setLoading(true)
    try {
      const response = await apiClient.createSchedule({
        courseCode: data.courseCode,
        dayOfWeek: data.dayOfWeek as DayOfWeek,
        startTime: data.startTime,
        endTime: data.endTime,
        isFixed,
      })

      if (response.success) {
        toast({ title: 'Schedule created.' })
        router.push('/schedules')
      } else {
        setServerError(response.error || 'Failed to create schedule')
      }
    } catch (error) {
      console.error('Create schedule failed:', error)
      setServerError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Create Schedule
          </h1>
          <p className="text-muted-foreground">
            Add a new class schedule to the system
          </p>
        </div>

        {/* Form */}
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Schedule Information</CardTitle>
            <CardDescription>
              Enter the details for the new class schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
            <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
              {serverError && <ServerErrorBanner message={serverError} />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="courseCode"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Course *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select course" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {courses.map((course) => (
                            <SelectItem key={course.code} value={course.code}>
                              {course.code} - {course.name}
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
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Day of Week *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dayOptions.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
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
                      <FormLabel>Start Time *</FormLabel>
                      <FormControl>
                        <Input type="time" disabled={loading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time *</FormLabel>
                      <FormControl>
                        <Input type="time" disabled={loading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isFixed"
                  checked={isFixed}
                  onChange={(e) => setIsFixed(e.target.checked)}
                  className="rounded border-gray-300"
                  disabled={loading}
                />
                <Label htmlFor="isFixed" className="cursor-pointer">Pin this slot (isFixed) — so auto-generation never moves it</Label>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Schedule'}
                </Button>
              </div>
            </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
