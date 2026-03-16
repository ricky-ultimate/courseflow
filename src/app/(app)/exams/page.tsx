'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { usePageLoadReporter } from '@/contexts/PageLoadContext'
import { RefetchIndicator } from '@/components/ui/refetch-indicator'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import {
  Exam,
  CreateExamData,
  UpdateExamData,
  Course,
  AcademicSession,
  College,
  Semester,
  VenueType,
  Level,
  ICT_VENUES,
} from '@/types'
import {
  Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ServerErrorBanner } from '@/components/ui/server-error-banner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ClipboardList,
  Filter,
  Info,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/state/error-state'

const VENUE_LABELS: Record<VenueType, string> = {
  [VenueType.UNIVERSITY_ICT_CENTER]: 'University ICT Centre',
  [VenueType.ICT_LAB_1]: 'ICT Lab 1',
  [VenueType.ICT_LAB_2]: 'ICT Lab 2',
  [VenueType.COMPUTER_LAB]: 'Computer Lab',
  [VenueType.LECTURE_HALL_1]: 'Lecture Hall 1',
  [VenueType.LECTURE_HALL_2]: 'Lecture Hall 2',
  [VenueType.LECTURE_HALL_3]: 'Lecture Hall 3',
  [VenueType.AUDITORIUM_A]: 'Auditorium A',
  [VenueType.AUDITORIUM_B]: 'Auditorium B',
  [VenueType.SEMINAR_ROOM_A]: 'Seminar Room A',
  [VenueType.SEMINAR_ROOM_B]: 'Seminar Room B',
  [VenueType.ROOM_101]: 'Room 101',
  [VenueType.ROOM_102]: 'Room 102',
  [VenueType.ROOM_201]: 'Room 201',
  [VenueType.ROOM_202]: 'Room 202',
  [VenueType.ROOM_301]: 'Room 301',
  [VenueType.ROOM_302]: 'Room 302',
  [VenueType.SCIENCE_LAB_1]: 'Science Lab 1',
  [VenueType.SCIENCE_LAB_2]: 'Science Lab 2',
}

const REGULAR_VENUES = Object.values(VenueType).filter((v) => !ICT_VENUES.includes(v))

const LEVEL_PILL: Record<string, string> = {
  [Level.LEVEL_100]: 'bg-slate-100 text-slate-700',
  [Level.LEVEL_200]: 'bg-blue-100 text-blue-700',
  [Level.LEVEL_300]: 'bg-violet-100 text-violet-700',
  [Level.LEVEL_400]: 'bg-orange-100 text-orange-700',
  [Level.LEVEL_500]: 'bg-red-100 text-red-700',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function isCbtCourse(course: Course | null | undefined): boolean {
  if (!course) return false
  return course.level === Level.LEVEL_100 || !!course.isGeneral
}

function courseDisplayLabel(c: Course): string {
  return `${c.code} — ${c.name} (${c.level?.replace('LEVEL_', '') ?? ''})`
}

function createExamSchema(courses: Course[]) {
  return z.object({
    courseCode: z.string().min(1, 'Course is required'),
    venue: z.nativeEnum(VenueType),
    date: z.string().min(1, 'Date is required'),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    studentCount: z.union([z.number(), z.string()]).transform((v) => {
      const n = typeof v === 'string' ? parseInt(v, 10) : v
      return isNaN(n as number) ? 1 : (n as number)
    }).pipe(z.number().min(1, 'Student count must be at least 1')),
    invigilators: z.string().optional(),
    targetCollege: z.nativeEnum(College).optional(),
  }).refine((d) => {
    const [sh, sm] = d.startTime.split(':').map(Number)
    const [eh, em] = d.endTime.split(':').map(Number)
    return (eh * 60 + (em || 0)) > (sh * 60 + (sm || 0))
  }, { message: 'End time must be after start time', path: ['endTime'] }).superRefine((data, ctx) => {
    const course = courses.find((c) => c.code === data.courseCode)
    if (course && isCbtCourse(course) && !ICT_VENUES.includes(data.venue)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CBT courses require an ICT venue', path: ['venue'] })
    }
    if (course?.isGeneral && !data.targetCollege) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'General courses require Target College', path: ['targetCollege'] })
    }
  })
}

export default function ExamsPage() {
  const { isAdmin, user } = useAuth()
  const { toast } = useToast()

  const [exams, setExams] = useState<Exam[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)
  const hasFetchedRef = useRef(false)
  usePageLoadReporter(loading)
  const [searchTerm, setSearchTerm] = useState('')
  const [sessionId, setSessionId] = useState<string>('')
  const [semester, setSemester] = useState<string>('all')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [editExam, setEditExam] = useState<Exam | null>(null)
  const openForEditExamIdRef = useRef<string | null>(null)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [courseComboboxQuery, setCourseComboboxQuery] = useState('')
  const [courseComboboxOpen, setCourseComboboxOpen] = useState(false)
  const [editCourseComboboxQuery, setEditCourseComboboxQuery] = useState('')
  const [editCourseComboboxOpen, setEditCourseComboboxOpen] = useState(false)
  const courseComboboxRef = useRef<HTMLDivElement>(null)
  const editCourseComboboxRef = useRef<HTMLDivElement>(null)

  const examSchema = useMemo(() => createExamSchema(courses), [courses])
  type ExamFormValues = z.infer<ReturnType<typeof createExamSchema>>

  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    mode: 'onBlur',
    defaultValues: {
      courseCode: '',
      venue: VenueType.LECTURE_HALL_1,
      date: '',
      startTime: '',
      endTime: '',
      studentCount: 1,
      invigilators: '',
      targetCollege: undefined,
    },
  })

  const editForm = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    mode: 'onBlur',
    defaultValues: {
      courseCode: '',
      venue: VenueType.LECTURE_HALL_1,
      date: '',
      startTime: '',
      endTime: '',
      studentCount: 1,
      invigilators: '',
      targetCollege: undefined,
    },
  })

  const openEditExam = useCallback(async (exam: Exam) => {
    openForEditExamIdRef.current = exam.id
    setEditExam(exam)
    setEditError('')
    editForm.reset({
      courseCode: exam.courseCode,
      venue: exam.venue ?? VenueType.LECTURE_HALL_1,
      date: exam.date?.includes('T') ? exam.date.split('T')[0] : (exam.date ?? ''),
      startTime: exam.startTime ?? '',
      endTime: exam.endTime ?? '',
      studentCount: exam.studentCount ?? 1,
      invigilators: exam.invigilators ?? '',
      targetCollege: exam.targetCollege ?? undefined,
    })
    try {
      const res = await apiClient.getExamById(exam.id)
      if (openForEditExamIdRef.current !== exam.id) return
      if (res.success && res.data) {
        const fresh = res.data as Exam
        setEditExam(fresh)
        editForm.reset({
          courseCode: fresh.courseCode,
          venue: fresh.venue ?? VenueType.LECTURE_HALL_1,
          date: fresh.date?.includes('T') ? fresh.date.split('T')[0] : (fresh.date ?? ''),
          startTime: fresh.startTime ?? '',
          endTime: fresh.endTime ?? '',
          studentCount: fresh.studentCount ?? 1,
          invigilators: fresh.invigilators ?? '',
          targetCollege: fresh.targetCollege ?? undefined,
        })
      }
    } catch {
      if (openForEditExamIdRef.current === exam.id) toast({ title: 'Failed to load exam', variant: 'destructive' })
    }
  }, [editForm, toast])

  const courseCode = form.watch('courseCode')
  const editCourseCode = editForm.watch('courseCode')
  const selectedCourse = courses.find((c) => c.code === courseCode)
  const filteredCoursesForCombobox = courses.filter((c) => {
    const q = courseComboboxQuery.toLowerCase().trim()
    if (!q) return true
    const code = (c.code ?? '').toLowerCase()
    const name = (c.name ?? '').toLowerCase()
    return code.includes(q) || name.includes(q)
  }).slice(0, 50)
  const editFilteredCoursesForCombobox = courses.filter((c) => {
    const q = editCourseComboboxQuery.toLowerCase().trim()
    if (!q) return true
    const code = (c.code ?? '').toLowerCase()
    const name = (c.name ?? '').toLowerCase()
    return code.includes(q) || name.includes(q)
  }).slice(0, 50)
  const isCbt = isCbtCourse(selectedCourse)

  const fetchData = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true)
      else setRefetching(true)
      setFetchError(null)
      const params: Record<string, unknown> = { page: 1, limit: 100 }
      if (sessionId) params.sessionId = sessionId
      if (semester && semester !== 'all') params.semester = semester
      if (searchTerm.trim()) params.searchTerm = searchTerm.trim()

      const [examsRes, coursesRes, sessRes] = await Promise.all([
        apiClient.getExams(params),
        apiClient.getCourses({ limit: 500 }),
        apiClient.getAcademicSessions({ limit: 50 }),
      ])

      const examR = getItemsFromResponse<Exam>(examsRes)
      const courseR = getItemsFromResponse<Course>(coursesRes)
      const sessR = getItemsFromResponse<AcademicSession>(sessRes)

      if (examR) setExams(examR.items)
      if (courseR) setCourses(courseR.items)
      if (sessR) setSessions(sessR.items)
      if (sessR?.items?.length && !sessionId) setSessionId(sessR.items[0]!.id)
    } catch {
      setFetchError('Failed to load exams')
      toast({ title: 'Failed to load exams', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefetching(false)
      hasFetchedRef.current = true
    }
  }, [sessionId, semester, searchTerm, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredExams = exams.filter((exam) => {
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const code = (exam.course?.code ?? exam.courseCode ?? '').toLowerCase()
    const name = (exam.course?.name ?? '').toLowerCase()
    return code.includes(term) || name.includes(term)
  })

  const resetForm = () => {
    form.reset({
      courseCode: '',
      venue: VenueType.LECTURE_HALL_1,
      date: '',
      startTime: '',
      endTime: '',
      studentCount: 1,
      invigilators: '',
      targetCollege: undefined,
    })
    setCourseComboboxQuery('')
    setCourseComboboxOpen(false)
    setCreateError('')
  }

  const handleCreate = form.handleSubmit(async (data) => {
    setCreateError('')
    try {
      setCreating(true)
      const payload: CreateExamData = {
        courseCode: data.courseCode,
        venue: data.venue,
        date: data.date.includes('T') ? data.date : `${data.date}T00:00:00.000Z`,
        startTime: data.startTime,
        endTime: data.endTime,
        studentCount: typeof data.studentCount === 'number' ? data.studentCount : parseInt(String(data.studentCount), 10) || 1,
        invigilators: data.invigilators,
        targetCollege: selectedCourse?.isGeneral ? data.targetCollege : undefined,
      }
      const res = await apiClient.createExam(payload)
      if (res.success) {
        toast({ title: `Exam scheduled for ${data.courseCode}.` })
        setIsCreateOpen(false)
        resetForm()
        fetchData()
      } else {
        setCreateError((res as { error?: string }).error || 'Failed to schedule')
      }
    } catch {
      setCreateError('Failed to schedule exam')
    } finally {
      setCreating(false)
    }
  })

  const editSelectedCourse = courses.find((c) => c.code === editCourseCode)
  const editIsCbt = isCbtCourse(editSelectedCourse)

  const handleEditSubmit = editForm.handleSubmit(async (data) => {
    if (!editExam) return
    setEditError('')
    try {
      setEditLoading(true)
      const payload: UpdateExamData = {
        courseCode: data.courseCode,
        venue: data.venue,
        date: data.date.includes('T') ? data.date : `${data.date}T00:00:00.000Z`,
        startTime: data.startTime,
        endTime: data.endTime,
        studentCount: typeof data.studentCount === 'number' ? data.studentCount : parseInt(String(data.studentCount), 10) || 1,
        invigilators: data.invigilators,
        targetCollege: editSelectedCourse?.isGeneral ? data.targetCollege : undefined,
      }
      const res = await apiClient.updateExam(editExam.id, payload)
      if (res.success) {
        toast({ title: 'Exam updated.' })
        setEditExam(null)
        fetchData()
      } else {
        setEditError((res as { error?: string }).error || 'Failed to update')
      }
    } catch {
      setEditError('Failed to update exam')
    } finally {
      setEditLoading(false)
    }
  })

  const handleDelete = async (): Promise<boolean> => {
    if (!deleteExam) return false
    try {
      setActionLoading(true)
      const res = await apiClient.deleteExam(deleteExam.id)
      if (res.success) {
        toast({ title: 'Exam deleted.' })
        setDeleteExam(null)
        fetchData()
        return true
      }
      toast({ title: (res as any).error, variant: 'destructive' })
      return false
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
      return false
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* 9.1 Page Layout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Exam Schedule</h1>
        {isAdmin && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
            <Plus className="h-4 w-4 mr-2" />
            Schedule Exam
          </Button>
        )}
      </div>

      {/* Filter bar (margin-top 16px via space-y-4) */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-0 order-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by course code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 order-1">
            <Select value={sessionId || 'all'} onValueChange={(v) => setSessionId(v === 'all' ? '' : v)}>
              <SelectTrigger className="w-[160px]"><SelectValue placeholder="Session" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                {sessions.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="Semester" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" className="md:hidden order-3" onClick={() => setFiltersOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </div>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="md:max-w-[400px]" onSwipeDown={() => setFiltersOpen(false)}>
          <DialogHeader><DialogTitle>Filters</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Session</Label>
              <Select value={sessionId || 'all'} onValueChange={(v) => setSessionId(v === 'all' ? '' : v)}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                  <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 9.2 Exam Table */}
      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="exams" onRetry={() => { setFetchError(null); fetchData(); }} />
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  <th className="p-3">Date</th>
                  <th className="p-3">Time</th>
                  <th className="p-3">Course</th>
                  <th className="p-3">Level</th>
                  <th className="p-3">Venue</th>
                  <th className="p-3">Students</th>
                  <th className="p-3">College</th>
                  <th className="p-3">Invigilators</th>
                  {isAdmin && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[90px]" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[80px]" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[140px]" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[60px]" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[70px]" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-8" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[60px]" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[100px]" /></td>
                    {isAdmin && <td className="p-3 text-right"><div className="h-8 bg-gray-200 animate-pulse rounded w-16 ml-auto" /></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="relative rounded-xl border border-gray-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          <ClipboardList className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No exams scheduled</h3>
          <p className="text-sm text-gray-400 mt-2">Schedule exams for the active session.</p>
          {isAdmin && (
            <Button className="mt-5 bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              + Schedule Exam
            </Button>
          )}
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b sticky top-0 z-10">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-3">Date</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Course</th>
                    <th className="p-3">Level</th>
                    <th className="p-3">Venue</th>
                    <th className="p-3">Students</th>
                    <th className="p-3">College</th>
                    <th className="p-3">Invigilators</th>
                    {isAdmin && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map((exam) => {
                    const course = exam.course ?? courses.find((c) => c.code === exam.courseCode)
                    const cbt = isCbtCourse(course)
                    return (
                      <tr key={exam.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 text-sm">{formatDate(exam.date)}</td>
                        <td className="p-3 text-sm">{exam.startTime} – {exam.endTime}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{exam.courseCode}</span>
                            {cbt && <Badge className="bg-indigo-100 text-indigo-700 text-xs">CBT</Badge>}
                            <span className="text-sm">{course?.name ?? ''}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge variant="secondary" className={LEVEL_PILL[course?.level ?? ''] ?? 'bg-gray-100'}>{course?.level?.replace('LEVEL_', '') ?? '—'}</Badge>
                        </td>
                        <td className="p-3 text-sm">{VENUE_LABELS[exam.venue] ?? exam.venue}</td>
                        <td className="p-3 text-sm">{exam.studentCount}</td>
                        <td className="p-3">
                          {exam.targetCollege ? (
                            <Badge variant="outline" className="text-xs">{exam.targetCollege}</Badge>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-3 text-sm truncate max-w-[120px]" title={exam.invigilators ?? ''}>{exam.invigilators ?? '—'}</td>
                        {isAdmin && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => openEditExam(exam)}><Pencil className="h-5 w-5" /><span className="sr-only">Edit</span></Button>
                              <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600" onClick={() => setDeleteExam(exam)}><Trash2 className="h-5 w-5" /><span className="sr-only">Delete</span></Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filteredExams.map((exam) => {
              const course = exam.course ?? courses.find((c) => c.code === exam.courseCode)
              const cbt = isCbtCourse(course)
              return (
                <div key={exam.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{formatDate(exam.date)}  {exam.startTime}–{exam.endTime}</p>
                    {cbt && <Badge className="bg-indigo-100 text-indigo-700 text-xs shrink-0">CBT</Badge>}
                  </div>
                  <p className="text-sm font-semibold mt-2">{exam.courseCode} · {course?.name ?? ''}</p>
                  <p className="text-sm text-gray-500">{VENUE_LABELS[exam.venue] ?? exam.venue}</p>
                  <p className="text-xs text-gray-500">{exam.studentCount} students · {exam.targetCollege ?? '—'}</p>
                  <div className="border-t mt-3 pt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate flex-1 min-w-0">{exam.invigilators ?? '—'}</p>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0"><MoreVertical className="h-5 w-5" /><span className="sr-only">Menu</span></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditExam(exam)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteExam(exam)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 9.3 Schedule Exam Modal */}
      <Dialog open={isCreateOpen} onOpenChange={(o) => { if (!o) { setIsCreateOpen(false); resetForm(); } }}>
        <DialogContent className="md:max-w-[560px]" onSwipeDown={() => { setIsCreateOpen(false); resetForm(); }}>
          <DialogHeader>
            <DialogTitle>Schedule Exam</DialogTitle>
            <DialogDescription>Select course, venue, date and time.</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleCreate} className={`space-y-4 transition-opacity ${creating ? "opacity-60" : ""}`}>
              {createError && <ServerErrorBanner message={createError} />}
              <FormField
                control={form.control}
                name="courseCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course *</FormLabel>
                    <FormControl>
                      <div ref={courseComboboxRef} className="relative">
                        <Input
                          className="pr-10"
                          placeholder="Search by code or name..."
                          value={selectedCourse && !courseComboboxQuery ? courseDisplayLabel(selectedCourse) : courseComboboxQuery}
                          onChange={(e) => {
                            setCourseComboboxQuery(e.target.value)
                            if (selectedCourse) field.onChange('')
                            setCourseComboboxOpen(true)
                          }}
                          onFocus={() => setCourseComboboxOpen(true)}
                          onKeyDown={(e) => e.key === 'Escape' && setCourseComboboxOpen(false)}
                          disabled={creating}
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        {courseComboboxOpen && (
                          <>
                            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setCourseComboboxOpen(false)} />
                            <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                              {filteredCoursesForCombobox.length === 0 ? (
                                <div className="px-3 py-6 text-center text-sm text-gray-500">No courses match</div>
                              ) : (
                                filteredCoursesForCombobox.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg focus:bg-gray-100 focus:outline-2 focus:outline-indigo-600 focus:outline-offset-2"
                                    onClick={() => {
                                      field.onChange(c.code)
                                      setCourseComboboxQuery('')
                                      setCourseComboboxOpen(false)
                                    }}
                                  >
                                    {courseDisplayLabel(c)}
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
              {isCbt && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>This is a CBT course (100L or General). You must select an ICT venue.</span>
                </div>
              )}
              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={creating}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500">ICT Venues (Required for CBT)</div>
                        {ICT_VENUES.map((v) => (
                          <SelectItem key={v} value={v}>{VENUE_LABELS[v]}</SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 mt-2">Regular Venues</div>
                        {REGULAR_VENUES.map((v) => (
                          <SelectItem key={v} value={v} disabled={isCbt}>{VENUE_LABELS[v]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam date *</FormLabel>
                      <FormControl>
                        <Input type="date" disabled={creating} {...field} />
                      </FormControl>
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
                      <FormControl>
                        <Input type="time" disabled={creating} {...field} />
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
                      <FormLabel>End time *</FormLabel>
                      <FormControl>
                        <Input type="time" disabled={creating} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="studentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student count *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} disabled={creating} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 1)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {selectedCourse?.isGeneral && (
                <FormField
                  control={form.control}
                  name="targetCollege"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target college *</FormLabel>
                      <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={creating}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={College.CBAS}>CBAS</SelectItem>
                          <SelectItem value={College.CHMS}>CHMS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="invigilators"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invigilators</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Dr. Smith, Prof. Jones" disabled={creating} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} disabled={creating}>Cancel</Button>
                <Button type="submit" disabled={creating}>{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Schedule Exam"}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Exam Modal */}
      <Dialog open={!!editExam} onOpenChange={(o) => { if (!o) { openForEditExamIdRef.current = null; setEditExam(null); } }}>
        <DialogContent className="md:max-w-[560px]" onSwipeDown={() => { openForEditExamIdRef.current = null; setEditExam(null); }}>
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>Update exam details.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={handleEditSubmit} className={`space-y-4 transition-opacity ${editLoading ? "opacity-60" : ""}`}>
              {editError && <ServerErrorBanner message={editError} />}
              <FormField
                control={editForm.control}
                name="courseCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Course *</FormLabel>
                    <FormControl>
                      <div ref={editCourseComboboxRef} className="relative">
                        <Input
                          className="pr-10"
                          placeholder="Search by code or name..."
                          value={editSelectedCourse && !editCourseComboboxQuery ? courseDisplayLabel(editSelectedCourse) : editCourseComboboxQuery}
                          onChange={(e) => {
                            setEditCourseComboboxQuery(e.target.value)
                            if (editSelectedCourse) field.onChange('')
                            setEditCourseComboboxOpen(true)
                          }}
                          onFocus={() => setEditCourseComboboxOpen(true)}
                          onKeyDown={(e) => e.key === 'Escape' && setEditCourseComboboxOpen(false)}
                          disabled={editLoading}
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                        {editCourseComboboxOpen && (
                          <>
                            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setEditCourseComboboxOpen(false)} />
                            <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                              {editFilteredCoursesForCombobox.length === 0 ? (
                                <div className="px-3 py-6 text-center text-sm text-gray-500">No courses match</div>
                              ) : (
                                editFilteredCoursesForCombobox.map((c) => (
                                  <button
                                    key={c.code}
                                    type="button"
                                    className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg focus:bg-gray-100 focus:outline-2 focus:outline-indigo-600 focus:outline-offset-2"
                                    onClick={() => {
                                      field.onChange(c.code)
                                      setEditCourseComboboxQuery('')
                                      setEditCourseComboboxOpen(false)
                                    }}
                                  >
                                    {courseDisplayLabel(c)}
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
              {editIsCbt && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 flex items-start gap-2">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>This is a CBT course (100L or General). You must select an ICT venue.</span>
                </div>
              )}
              <FormField
                control={editForm.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Venue *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={editLoading}>
                      <FormControl>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500">ICT Venues (Required for CBT)</div>
                        {ICT_VENUES.map((v) => (
                          <SelectItem key={v} value={v}>{VENUE_LABELS[v]}</SelectItem>
                        ))}
                        <div className="px-2 py-1.5 text-xs font-medium text-gray-500 mt-2">Regular Venues</div>
                        {REGULAR_VENUES.map((v) => (
                          <SelectItem key={v} value={v} disabled={editIsCbt}>{VENUE_LABELS[v]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam date *</FormLabel>
                      <FormControl>
                        <Input type="date" disabled={editLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start time *</FormLabel>
                      <FormControl>
                        <Input type="time" disabled={editLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End time *</FormLabel>
                      <FormControl>
                        <Input type="time" disabled={editLoading} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={editForm.control}
                name="studentCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student count *</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} disabled={editLoading} {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 1)} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editSelectedCourse?.isGeneral && (
                <FormField
                  control={editForm.control}
                  name="targetCollege"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target college *</FormLabel>
                      <Select value={field.value ?? ''} onValueChange={field.onChange} disabled={editLoading}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select college" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={College.CBAS}>CBAS</SelectItem>
                          <SelectItem value={College.CHMS}>CHMS</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={editForm.control}
                name="invigilators"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Invigilators</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Dr. Smith, Prof. Jones" disabled={editLoading} {...field} value={field.value ?? ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => { openForEditExamIdRef.current = null; setEditExam(null); }} disabled={editLoading}>Cancel</Button>
                <Button type="submit" disabled={editLoading}>{editLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Update Exam'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteExam} onOpenChange={(o) => !o && setDeleteExam(null)} title="Delete exam?" description={`This will permanently remove the exam for ${deleteExam?.courseCode ?? ''}.`} icon={Trash2} iconClassName="bg-red-500 text-white" confirmLabel="Delete" confirmVariant="destructive" onConfirm={handleDelete} loading={actionLoading} />
    </div>
  )
}
