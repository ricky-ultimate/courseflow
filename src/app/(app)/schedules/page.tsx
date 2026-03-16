'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAuth } from '@/contexts/AuthContext'
import { useActiveSessionInvalidateCount } from '@/contexts/ActiveSessionContext'
import { usePageLoadReporter } from '@/contexts/PageLoadContext'
import { RefetchIndicator } from '@/components/ui/refetch-indicator'
import { useToast } from '@/hooks/use-toast'
import {
  Calendar,
  Search,
  Filter,
  Clock,
  BookOpen,
  RefreshCw,
  FileText,
  Plus,
  FileDown,
  ChevronDown,
  Pencil,
  Trash2,
  MoreVertical,
  Lock,
} from 'lucide-react'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Schedule, Department, Level, DayOfWeek, Semester, Course, AcademicSession } from '@/types'
import { GenerateScheduleModal } from '@/components/dashboard/generate-schedule-modal'
import { TimetableGrid } from '@/components/schedules/timetable-grid'
import { MobileTimetable } from '@/components/schedules/mobile-timetable'
import { ScheduleDetailSheet } from '@/components/schedules/schedule-detail-sheet'
import { CreateScheduleModal } from '@/components/schedules/create-schedule-modal'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/state/error-state'
import { Pagination } from '@/components/ui/pagination'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import * as XLSX from 'xlsx'
import html2canvas from 'html2canvas'

export default function SchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isAdmin, isLecturer, isHod, user } = useAuth()
  const { toast } = useToast()
  const activeSessionInvalidateCount = useActiveSessionInvalidateCount()

  const isStaff = isAdmin || isLecturer || isHod /* for read access */
  const canMutateSchedules = isAdmin || isHod /* LECTURER is read-only per 0.1 */
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(null)
  const [viewMode, setViewMode] = useState<'timetable' | 'list'>('timetable')
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null)
  const openForDetailScheduleIdRef = useRef<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createModalPrefill, setCreateModalPrefill] = useState<{ courseCode?: string; dayOfWeek?: DayOfWeek; startTime?: string }>({})
  const [mobileSelectedDay, setMobileSelectedDay] = useState<DayOfWeek>(DayOfWeek.MONDAY)
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null)
  const [listSort, setListSort] = useState<{ key: 'day' | 'time'; dir: 'asc' | 'desc' | null }>({ key: 'day', dir: 'asc' })
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)
  const hasFetchedRef = useRef(false)
  usePageLoadReporter(loading)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all')
  const [selectedLevel, setSelectedLevel] = useState<string>('all')
  const [selectedDay, setSelectedDay] = useState<string>('all')
  const [selectedSemester, setSelectedSemester] = useState<string>('all')
  const [selectedSessionId, setSelectedSessionId] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit, setLimit] = useState(25)

  const dayOptions = [
    { value: DayOfWeek.MONDAY, label: 'Monday', shortLabel: 'MON.' },
    { value: DayOfWeek.TUESDAY, label: 'Tuesday', shortLabel: 'TUES.' },
    { value: DayOfWeek.WEDNESDAY, label: 'Wednesday', shortLabel: 'WED.' },
    { value: DayOfWeek.THURSDAY, label: 'Thursday', shortLabel: 'THURS.' },
    { value: DayOfWeek.FRIDAY, label: 'Friday', shortLabel: 'FRI.' },
    { value: DayOfWeek.SATURDAY, label: 'Saturday', shortLabel: 'SAT.' },
    { value: DayOfWeek.SUNDAY, label: 'Sunday', shortLabel: 'SUN.' },
  ]

  const dayLabels: Record<DayOfWeek, string> = Object.fromEntries(dayOptions.map((d) => [d.value, d.label])) as Record<DayOfWeek, string>
  const deptCodeToName = Object.fromEntries(departments.map((d) => [d.code, d.name]))

  const levelOptions = [
    { value: Level.LEVEL_100, label: '100 Level' },
    { value: Level.LEVEL_200, label: '200 Level' },
    { value: Level.LEVEL_300, label: '300 Level' },
    { value: Level.LEVEL_400, label: '400 Level' },
    { value: Level.LEVEL_500, label: '500 Level' },
  ]

  const semesterOptions = [
    { value: Semester.FIRST, label: 'First Semester' },
    { value: Semester.SECOND, label: 'Second Semester' },
  ]

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, sessRes, activeRes] = await Promise.all([
          apiClient.getDepartments({ limit: 100 }),
          apiClient.getAcademicSessions({ limit: 50 }),
          apiClient.getActiveAcademicSession(),
        ])
        const d = getItemsFromResponse<Department>(deptRes)
        const s = getItemsFromResponse<AcademicSession>(sessRes)
        if (d) setDepartments(d.items)
        if (s) setSessions(s.items)
        if (activeRes.success && activeRes.data) {
          const act = activeRes.data as AcademicSession
          setActiveSession(act)
          setSelectedSessionId(act.id)
        } else if (s?.items?.length) {
          setSelectedSessionId(s.items[0]!.id)
        }
      } catch (e) {
        console.error('Failed to fetch:', e)
      }
    }
    fetchData()
  }, [activeSessionInvalidateCount])

  const fetchSchedules = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true)
      else setRefetching(true)
      setFetchError(null)
      const params: any = {
        page: currentPage,
        limit,
      }

      if (selectedDepartment && selectedDepartment !== 'all') params.departmentCode = selectedDepartment
      if (selectedLevel && selectedLevel !== 'all') params.level = selectedLevel
      if (selectedDay && selectedDay !== 'all') params.dayOfWeek = selectedDay
      if (selectedSemester && selectedSemester !== 'all') params.semester = selectedSemester
      if (selectedSessionId && selectedSessionId !== 'all') params.sessionId = selectedSessionId

      const response = await apiClient.getSchedules(params)
      const result = getItemsFromResponse<Schedule>(response)
      if (result) {
        setSchedules(result.items)
        setTotalPages(result.totalPages)
        setTotal(result.total)
      }
    } catch (error) {
      console.error('Failed to fetch schedules:', error)
      setFetchError('Failed to load schedules')
    } finally {
      setLoading(false)
      setRefetching(false)
      hasFetchedRef.current = true
    }
  }, [currentPage, limit, selectedDepartment, selectedLevel, selectedDay, selectedSemester, selectedSessionId])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  useEffect(() => {
    const create = searchParams.get('create')
    const course = searchParams.get('course')
    const day = searchParams.get('day') as DayOfWeek | null
    const start = searchParams.get('start')
    if (create === '1' && canMutateSchedules) {
      setCreateModalOpen(true)
      setCreateModalPrefill({ courseCode: course ?? undefined, dayOfWeek: day ?? undefined, startTime: start ?? undefined })
    }
  }, [searchParams, canMutateSchedules])

  const openScheduleDetail = useCallback(async (s: Schedule) => {
    openForDetailScheduleIdRef.current = s.id
    setDetailSchedule(s)
    try {
      const res = await apiClient.getScheduleById(s.id)
      if (openForDetailScheduleIdRef.current !== s.id) return
      if (res.success && res.data) setDetailSchedule(res.data as Schedule)
    } catch {
      if (openForDetailScheduleIdRef.current === s.id) toast({ title: 'Failed to load schedule details', variant: 'destructive' })
    }
  }, [toast])

  const handleDeleteSchedule = async (): Promise<boolean> => {
    if (!deleteSchedule) return false
    try {
      setDeleteLoading(true)
      const res = await apiClient.deleteSchedule(deleteSchedule.id)
      if (res.success) {
        toast({ title: 'Schedule deleted.' })
        setDeleteSchedule(null)
        openForDetailScheduleIdRef.current = null
        setDetailSchedule(null)
        fetchSchedules()
        return true
      }
      toast({ title: (res as any).error ?? 'Failed', variant: 'destructive' })
      return false
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
      return false
    } finally {
      setDeleteLoading(false)
    }
  }

  const filteredSchedules = schedules.filter(schedule =>
    schedule.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    schedule.course?.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filterCount = [
    selectedSessionId && selectedSessionId !== 'all',
    selectedSemester !== 'all',
    selectedDepartment !== 'all',
    selectedLevel !== 'all',
    viewMode === 'timetable' && selectedDay !== 'all',
  ].filter(Boolean).length

  const handleReset = () => {
    setSearchTerm('')
    setSelectedDepartment('all')
    setSelectedLevel('all')
    setSelectedDay('all')
    setSelectedSemester('all')
    setSelectedSessionId('')
    setCurrentPage(1)
  }

  // Helper function to get time slots from schedules
  const getTimeSlots = (schedules: Schedule[]): string[] => {
    const timeSet = new Set<string>()
    schedules.forEach(schedule => {
      const timeKey = `${schedule.startTime}-${schedule.endTime}`
      timeSet.add(timeKey)
    })
    return Array.from(timeSet).sort((a, b) => {
      const [startA] = a.split('-')
      const [startB] = b.split('-')
      return startA.localeCompare(startB)
    })
  }

  // Helper function to format time slot for display (matches image format)
  const formatTimeSlot = (startTime: string, endTime: string): string => {
    try {
      const [startHours, startMinutes] = startTime.split(':')
      const [endHours, endMinutes] = endTime.split(':')
      const startHour = parseInt(startHours)
      const endHour = parseInt(endHours)
      
      const startAMPM = startHour >= 12 ? 'PM' : 'AM'
      const endAMPM = endHour >= 12 ? 'PM' : 'AM'
      const displayStartHour = startHour % 12 || 12
      const displayEndHour = endHour % 12 || 12
      
      // Format like "9-10 (AM)" or "11AM-12PM"
      if (startAMPM === endAMPM) {
        return `${displayStartHour}-${displayEndHour} (${startAMPM})`
      } else {
        return `${displayStartHour}${startAMPM}-${displayEndHour}${endAMPM}`
      }
    } catch {
      return `${startTime} - ${endTime}`
    }
  }


  // Fetch all schedules for export (not just current page)
  const fetchAllSchedulesForExport = async (): Promise<Schedule[]> => {
    try {
      const params: Record<string, unknown> = {
        page: 1,
        limit: 100,
      }
      if (selectedDepartment && selectedDepartment !== 'all') params.departmentCode = selectedDepartment
      if (selectedLevel && selectedLevel !== 'all') params.level = selectedLevel
      if (selectedDay && selectedDay !== 'all') params.dayOfWeek = selectedDay
      if (searchTerm) params.search = searchTerm

      const firstResponse = await apiClient.getSchedules(params)
      const firstResult = getItemsFromResponse<Schedule>(firstResponse)
      if (!firstResult) throw new Error('Failed to fetch schedules')

      let allSchedules = [...firstResult.items]
      for (let page = 2; page <= firstResult.totalPages; page++) {
        const pageResponse = await apiClient.getSchedules({ ...params, page })
        const pageResult = getItemsFromResponse<Schedule>(pageResponse)
        if (pageResult) allSchedules = [...allSchedules, ...pageResult.items]
      }

      if (searchTerm && allSchedules.length > 0) {
        const term = searchTerm.toLowerCase()
        const filtered = allSchedules.filter(schedule =>
          schedule.course?.name?.toLowerCase().includes(term) ||
          schedule.course?.code?.toLowerCase().includes(term)
        )
        // Use filtered results if we got matches
        if (filtered.length > 0) {
          allSchedules = filtered
        }
      }

      // Fetch courses with lecturer information to enrich schedules
      const courseCodes = Array.from(new Set(allSchedules.map(s => s.courseCode).filter(Boolean)))
      if (courseCodes.length > 0) {
        try {
          const coursesResponse = await apiClient.getCourses({ limit: 1000 })
          const coursesResult = getItemsFromResponse<Course>(coursesResponse)
          const courses = coursesResult?.items ?? []
          if (courses.length > 0) {

            // Create a map of course codes to courses with lecturer info
            const courseMap = new Map<string, any>()
            courses.forEach(course => {
              if (course.code) {
                courseMap.set(course.code, course)
              }
            })

            // Enrich schedules with lecturer information from courses
            allSchedules = allSchedules.map(schedule => {
              if (schedule.courseCode && courseMap.has(schedule.courseCode)) {
                const enrichedCourse = courseMap.get(schedule.courseCode)
                if (schedule.course && enrichedCourse) {
                  return {
                    ...schedule,
                    course: {
                      ...schedule.course,
                      lecturer: enrichedCourse.lecturer || schedule.course.lecturer,
                    }
                  } as Schedule
                }
              }
              return schedule
            })
          }
        } catch (error) {
          console.warn('Failed to fetch courses for lecturer info:', error)
          // Continue without enriching, will use available data
        }
      }

      return allSchedules
    } catch (error) {
      console.error('Failed to fetch all schedules:', error)
      // Only fallback to visible schedules if API completely fails
      // But note: this will only have current page data
      if (filteredSchedules.length > 0) {
        console.warn('API fetch failed, using visible schedules (may be incomplete)')
        return filteredSchedules
      }
      return []
    }
  }

  // Export as PDF
  const exportAsPDF = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      })

      const allSchedules = await fetchAllSchedulesForExport()
      
      if (!allSchedules || allSchedules.length === 0) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        })
        return
      }

      // Build grid with all schedules
      const timeSlots = getTimeSlots(allSchedules)
      const grid: Record<string, Record<string, { code: string }[]>> = {}

      dayOptions.forEach(day => {
        grid[day.value] = {}
        timeSlots.forEach(timeSlot => {
          grid[day.value][timeSlot] = []
        })
      })

      allSchedules.forEach(schedule => {
        const day = schedule.dayOfWeek
        const timeSlot = `${schedule.startTime}-${schedule.endTime}`
        const courseCode = schedule.course?.code || 'N/A'
        if (!grid[day]) grid[day] = {}
        if (!grid[day][timeSlot]) grid[day][timeSlot] = []
        
        grid[day][timeSlot].push({ code: courseCode })
      })

      // Build course details
      const courseMap = new Map<string, {
        code: string
        title: string
        lecturer: string
        units: number
        status: string
      }>()

      allSchedules.forEach(schedule => {
        if (!schedule.course) return
        const code = schedule.course.code
        if (!courseMap.has(code)) {
          // Get lecturer name from lecturer object, or email, or fallback to N/A
          let lecturerName = 'N/A'
          if (schedule.course.lecturer?.name) {
            lecturerName = schedule.course.lecturer.name
          } else if (schedule.course.lecturer?.email) {
            lecturerName = schedule.course.lecturer.email
          }
          
          courseMap.set(code, {
            code,
            title: schedule.course.name,
            lecturer: lecturerName,
            units: schedule.course.credits,
            status: 'C'
          })
        }
      })

      const courseDetails = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code))
      const doc = new jsPDF('landscape', 'mm', 'a4')
      
      // Timetable Grid
      const timetableData: string[][] = []
      dayOptions.forEach(day => {
        const row: string[] = [day.shortLabel || day.label]
        timeSlots.forEach(timeSlot => {
          const [startTime, endTime] = timeSlot.split('-')
          const timeLabel = formatTimeSlot(startTime, endTime)
          const schedules = grid[day.value]?.[timeSlot] || []
          if (schedules.length > 0) {
            const cellContent = schedules.map(s => {
              return s.code
            }).join(' / ')
            row.push(cellContent)
          } else {
            row.push('')
          }
        })
        timetableData.push(row)
      })

      const timeHeaders = ['Day', ...timeSlots.map(ts => {
        const [start, end] = ts.split('-')
        return formatTimeSlot(start, end)
      })]

      autoTable(doc, {
        head: [timeHeaders],
        body: timetableData,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { top: 20 },
      })

      // Course Details Table
      const courseData = courseDetails.map((course, index) => [
        (index + 1).toString(),
        course.code,
        course.title,
        course.lecturer,
        course.units.toString(),
        course.status
      ])

      autoTable(doc, {
        head: [['S/NO.', 'COURSE CODE', 'COURSE TITLE', 'LECTURER', 'UNITS', 'STATUS']],
        body: courseData,
        startY: (doc as any).lastAutoTable.finalY + 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      })

      const date = new Date().toISOString().split('T')[0]
      doc.save(`timetable_${date}.pdf`)

      toast({
        title: "Export Successful",
        description: `Timetable exported as PDF (${allSchedules.length} schedules)`,
      })
    } catch (error) {
      console.error('PDF export failed:', error)
      toast({
        title: "Export Error",
        description: "An error occurred while exporting PDF",
        variant: "destructive",
      })
    }
  }

  // Export as XLSX
  const exportAsXLSX = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      })

      const allSchedules = await fetchAllSchedulesForExport()
      
      if (!allSchedules || allSchedules.length === 0) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        })
        return
      }

      // Build grid with all schedules
      const timeSlots = getTimeSlots(allSchedules)
      const grid: Record<string, Record<string, { code: string }[]>> = {}

      dayOptions.forEach(day => {
        grid[day.value] = {}
        timeSlots.forEach(timeSlot => {
          grid[day.value][timeSlot] = []
        })
      })

      allSchedules.forEach(schedule => {
        const day = schedule.dayOfWeek
        const timeSlot = `${schedule.startTime}-${schedule.endTime}`
        const courseCode = schedule.course?.code || 'N/A'
        if (!grid[day]) grid[day] = {}
        if (!grid[day][timeSlot]) grid[day][timeSlot] = []
        
        grid[day][timeSlot].push({ code: courseCode })
      })

      // Build course details
      const courseMap = new Map<string, {
        code: string
        title: string
        lecturer: string
        units: number
        status: string
      }>()

      allSchedules.forEach(schedule => {
        if (!schedule.course) return
        const code = schedule.course.code
        if (!courseMap.has(code)) {
          // Get lecturer name from lecturer object, or email, or fallback to N/A
          let lecturerName = 'N/A'
          if (schedule.course.lecturer?.name) {
            lecturerName = schedule.course.lecturer.name
          } else if (schedule.course.lecturer?.email) {
            lecturerName = schedule.course.lecturer.email
          }
          
          courseMap.set(code, {
            code,
            title: schedule.course.name,
            lecturer: lecturerName,
            units: schedule.course.credits,
            status: 'C'
          })
        }
      })

      const courseDetails = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code))

      // Create workbook
      const wb = XLSX.utils.book_new()

      // Timetable Grid Sheet
      const timetableData: string[][] = []
      const timeHeaders = ['Day', ...timeSlots.map(ts => {
        const [start, end] = ts.split('-')
        return formatTimeSlot(start, end)
      })]
      timetableData.push(timeHeaders)

      dayOptions.forEach(day => {
        const row: string[] = [day.shortLabel || day.label]
        timeSlots.forEach(timeSlot => {
          const schedules = grid[day.value]?.[timeSlot] || []
          if (schedules.length > 0) {
            const cellContent = schedules.map(s => {
              return s.code
            }).join(' / ')
            row.push(cellContent)
          } else {
            row.push('')
          }
        })
        timetableData.push(row)
      })

      const ws1 = XLSX.utils.aoa_to_sheet(timetableData)
      XLSX.utils.book_append_sheet(wb, ws1, 'Timetable')

      // Course Details Sheet
      const courseData = [
        ['S/NO.', 'COURSE CODE', 'COURSE TITLE', 'LECTURER', 'UNITS', 'STATUS'],
        ...courseDetails.map((course, index) => [
          index + 1,
          course.code,
          course.title,
          course.lecturer,
          course.units,
          course.status
        ])
      ]

      const ws2 = XLSX.utils.aoa_to_sheet(courseData)
      XLSX.utils.book_append_sheet(wb, ws2, 'Course Details')

      const date = new Date().toISOString().split('T')[0]
      XLSX.writeFile(wb, `timetable_${date}.xlsx`)

      toast({
        title: "Export Successful",
        description: `Timetable exported as XLSX (${allSchedules.length} schedules)`,
      })
    } catch (error) {
      console.error('XLSX export failed:', error)
      toast({
        title: "Export Error",
        description: "An error occurred while exporting XLSX",
        variant: "destructive",
      })
    }
  }

  // Export as CSV
  const exportAsCSV = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      })

      const allSchedules = await fetchAllSchedulesForExport()
      
      if (!allSchedules || allSchedules.length === 0) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        })
        return
      }

      // Build grid with all schedules
      const timeSlots = getTimeSlots(allSchedules)
      const grid: Record<string, Record<string, { code: string }[]>> = {}

      dayOptions.forEach(day => {
        grid[day.value] = {}
        timeSlots.forEach(timeSlot => {
          grid[day.value][timeSlot] = []
        })
      })

      allSchedules.forEach(schedule => {
        const day = schedule.dayOfWeek
        const timeSlot = `${schedule.startTime}-${schedule.endTime}`
        const courseCode = schedule.course?.code || 'N/A'
        if (!grid[day]) grid[day] = {}
        if (!grid[day][timeSlot]) grid[day][timeSlot] = []
        
        grid[day][timeSlot].push({ code: courseCode })
      })

      // Build course details
      const courseMap = new Map<string, {
        code: string
        title: string
        lecturer: string
        units: number
        status: string
      }>()

      allSchedules.forEach(schedule => {
        if (!schedule.course) return
        const code = schedule.course.code
        if (!courseMap.has(code)) {
          // Get lecturer name from lecturer object, or email, or fallback to N/A
          let lecturerName = 'N/A'
          if (schedule.course.lecturer?.name) {
            lecturerName = schedule.course.lecturer.name
          } else if (schedule.course.lecturer?.email) {
            lecturerName = schedule.course.lecturer.email
          }
          
          courseMap.set(code, {
            code,
            title: schedule.course.name,
            lecturer: lecturerName,
            units: schedule.course.credits,
            status: 'C'
          })
        }
      })

      const courseDetails = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code))

      let csvContent = ''

      // Timetable Grid
      csvContent += 'TIMETABLE\n'
      const timeHeaders = ['Day', ...timeSlots.map(ts => {
        const [start, end] = ts.split('-')
        return formatTimeSlot(start, end)
      })]
      csvContent += timeHeaders.map(h => `"${h}"`).join(',') + '\n'

      dayOptions.forEach(day => {
        const row: string[] = [day.shortLabel || day.label]
        timeSlots.forEach(timeSlot => {
          const schedules = grid[day.value]?.[timeSlot] || []
          if (schedules.length > 0) {
            const cellContent = schedules.map(s => {
              return s.code
            }).join(' / ')
            row.push(cellContent)
          } else {
            row.push('')
          }
        })
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
      })

      csvContent += '\n\nCOURSE DETAILS\n'
      csvContent += '"S/NO.","COURSE CODE","COURSE TITLE","LECTURER","UNITS","STATUS"\n'
      courseDetails.forEach((course, index) => {
        csvContent += `"${index + 1}","${course.code}","${course.title}","${course.lecturer}","${course.units}","${course.status}"\n`
      })

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const date = new Date().toISOString().split('T')[0]
      link.download = `timetable_${date}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({
        title: "Export Successful",
        description: `Timetable exported as CSV (${allSchedules.length} schedules)`,
      })
    } catch (error) {
      console.error('CSV export failed:', error)
      toast({
        title: "Export Error",
        description: "An error occurred while exporting CSV",
        variant: "destructive",
      })
    }
  }

  // Export as PNG
  const exportAsPNG = async () => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      })

      const allSchedules = await fetchAllSchedulesForExport()
      
      if (!allSchedules || allSchedules.length === 0) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        })
        return
      }

      // Create a temporary container for the export
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.width = '1200px'
      container.style.backgroundColor = 'white'
      container.style.padding = '20px'
      document.body.appendChild(container)

      // Build grid with all schedules
      const timeSlots = getTimeSlots(allSchedules)
      const grid: Record<string, Record<string, { code: string }[]>> = {}

      dayOptions.forEach(day => {
        grid[day.value] = {}
        timeSlots.forEach(timeSlot => {
          grid[day.value][timeSlot] = []
        })
      })

      allSchedules.forEach(schedule => {
        const day = schedule.dayOfWeek
        const timeSlot = `${schedule.startTime}-${schedule.endTime}`
        const courseCode = schedule.course?.code || 'N/A'
        if (!grid[day]) grid[day] = {}
        if (!grid[day][timeSlot]) grid[day][timeSlot] = []
        
        grid[day][timeSlot].push({ code: courseCode })
      })

      // Build course details
      const courseMap = new Map<string, {
        code: string
        title: string
        lecturer: string
        units: number
        status: string
      }>()

      allSchedules.forEach(schedule => {
        if (!schedule.course) return
        const code = schedule.course.code
        if (!courseMap.has(code)) {
          // Get lecturer name from lecturer object, or email, or fallback to N/A
          let lecturerName = 'N/A'
          if (schedule.course.lecturer?.name) {
            lecturerName = schedule.course.lecturer.name
          } else if (schedule.course.lecturer?.email) {
            lecturerName = schedule.course.lecturer.email
          }
          
          courseMap.set(code, {
            code,
            title: schedule.course.name,
            lecturer: lecturerName,
            units: schedule.course.credits,
            status: 'C'
          })
        }
      })

      const courseDetails = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code))

      // Create timetable table
      let html = `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="text-align: center; margin-bottom: 20px;">ACADEMIC TIMETABLE</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 10px;">
            <thead>
              <tr style="background-color: #4285F4; color: white;">
                <th style="border: 1px solid #000; padding: 8px; text-align: left;">Day</th>
                ${timeSlots.map(ts => {
                  const [start, end] = ts.split('-')
                  return '<th style="border: 1px solid #000; padding: 8px; text-align: center;">' + formatTimeSlot(start, end) + '</th>'
                }).join('')}
              </tr>
            </thead>
            <tbody>
              ${dayOptions.map(day => {
                const dayCells = timeSlots.map(timeSlot => {
                  const schedules = grid[day.value]?.[timeSlot] || []
                  const cellContent = schedules.length > 0
                    ? schedules.map(s => s.code).join(' / ')
                    : ''
                  return '<td style="border: 1px solid #000; padding: 8px; text-align: center;">' + cellContent + '</td>'
                }).join('')
                return '<tr><td style="border: 1px solid #000; padding: 8px; font-weight: bold;">' + (day.shortLabel || day.label) + '</td>' + dayCells + '</tr>'
              }).join('')}
            </tbody>
          </table>

          <h2 style="text-align: center; margin-bottom: 20px;">COURSE DETAILS</h2>
          <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
            <thead>
              <tr style="background-color: #4285F4; color: white;">
                <th style="border: 1px solid #000; padding: 8px;">S/NO.</th>
                <th style="border: 1px solid #000; padding: 8px;">COURSE CODE</th>
                <th style="border: 1px solid #000; padding: 8px;">COURSE TITLE</th>
                <th style="border: 1px solid #000; padding: 8px;">LECTURER</th>
                <th style="border: 1px solid #000; padding: 8px;">UNITS</th>
                <th style="border: 1px solid #000; padding: 8px;">STATUS</th>
              </tr>
            </thead>
            <tbody>
              ${courseDetails.map((course, index) =>
                '<tr>' +
                  '<td style="border: 1px solid #000; padding: 8px; text-align: center;">' + (index + 1) + '</td>' +
                  '<td style="border: 1px solid #000; padding: 8px;">' + course.code + '</td>' +
                  '<td style="border: 1px solid #000; padding: 8px;">' + course.title + '</td>' +
                  '<td style="border: 1px solid #000; padding: 8px;">' + course.lecturer + '</td>' +
                  '<td style="border: 1px solid #000; padding: 8px; text-align: center;">' + course.units + '</td>' +
                  '<td style="border: 1px solid #000; padding: 8px; text-align: center;">' + course.status + '</td>' +
                '</tr>'
              ).join('')}
            </tbody>
          </table>
        </div>
      `

      container.innerHTML = html

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = imgData
      const date = new Date().toISOString().split('T')[0]
      link.download = `timetable_${date}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      document.body.removeChild(container)

      toast({
        title: "Export Successful",
        description: `Timetable exported as PNG (${allSchedules.length} schedules)`,
      })
    } catch (error) {
      console.error('PNG export failed:', error)
      toast({
        title: "Export Error",
        description: "An error occurred while exporting PNG",
        variant: "destructive",
      })
    }
  }

  const getVenueBadgeColor = () => 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-300'

  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':')
      const hour = parseInt(hours)
      const ampm = hour >= 12 ? 'PM' : 'AM'
      const displayHour = hour % 12 || 12
      return `${displayHour}:${minutes} ${ampm}`
    } catch {
      return time
    }
  }

  // Group schedules by day
  const schedulesByDay = filteredSchedules.reduce((acc, schedule) => {
    const day = schedule.dayOfWeek
    if (!acc[day]) acc[day] = []
    acc[day].push(schedule)
    return acc
  }, {} as Record<string, Schedule[]>)

  return (
    <div>
      <div className="space-y-4">
        {/* 8.1 Page header — mobile: Schedules + Generate only; view toggle + Manual in secondary row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-semibold">Schedules</h1>
            {(activeSession || selectedSessionId) && (
              <Badge variant="secondary" className="bg-indigo-100 text-indigo-700" style={{ fontSize: 13 }}>
                {(sessions.find((x) => x.id === selectedSessionId) ?? activeSession)?.name ?? 'Session'} · {selectedSemester === Semester.FIRST ? 'First' : selectedSemester === Semester.SECOND ? 'Second' : 'All'} Semester
              </Badge>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <div className="flex rounded-lg border p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 text-sm rounded-md ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timetable')}
                className={`px-3 py-1.5 text-sm rounded-md ${viewMode === 'timetable' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
              >
                Timetable
              </button>
            </div>
            {canMutateSchedules && (
              <>
                <Button variant="outline" size="sm" onClick={() => { setEditSchedule(null); setCreateModalPrefill({}); setCreateModalOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Manual Schedule
                </Button>
                <Button size="sm" onClick={() => setGenerateModalOpen(true)}>
                  Generate
                </Button>
              </>
            )}
          </div>
          <div className="md:hidden">
            <Button size="sm" onClick={() => setGenerateModalOpen(true)}>
              Generate
            </Button>
          </div>
        </div>
        <div className="md:hidden flex gap-2">
          <div className="flex rounded-lg border p-0.5 flex-1">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md ${viewMode === 'list' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timetable')}
              className={`flex-1 px-3 py-1.5 text-sm rounded-md ${viewMode === 'timetable' ? 'bg-indigo-600 text-white' : 'text-gray-600'}`}
            >
              Timetable
            </button>
          </div>
          {canMutateSchedules && (
            <Button variant="outline" size="sm" className="flex-1" onClick={() => { setEditSchedule(null); setCreateModalPrefill({}); setCreateModalOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Manual
            </Button>
          )}
        </div>
        <GenerateScheduleModal open={generateModalOpen} onOpenChange={setGenerateModalOpen} onSuccess={fetchSchedules} isHod={!!isHod} departmentCode={isHod && user?.departmentCode ? user.departmentCode : undefined} departmentName={isHod && user?.departmentCode ? departments.find((d) => d.code === user.departmentCode)?.name : undefined} />
        <CreateScheduleModal
          open={createModalOpen}
          onOpenChange={(o) => {
            if (!o) setEditSchedule(null)
            setCreateModalOpen(o)
          }}
          onSuccess={fetchSchedules}
          prefill={createModalPrefill}
          editSchedule={editSchedule}
          activeSessionId={selectedSessionId || activeSession?.id}
          existingSchedules={schedules}
        />
        <ScheduleDetailSheet
          schedule={detailSchedule}
          sessionName={sessions.find((s) => s.id === detailSchedule?.sessionId)?.name}
          onClose={() => { openForDetailScheduleIdRef.current = null; setDetailSchedule(null); }}
          onEdit={(s) => { openForDetailScheduleIdRef.current = null; setDetailSchedule(null); setEditSchedule(s); setCreateModalOpen(true); }}
          onDelete={(s) => setDeleteSchedule(s)}
          canMutate={canMutateSchedules}
          isAdmin={isAdmin}
        />
        <ConfirmDialog
          open={!!deleteSchedule}
          onOpenChange={(o) => !o && setDeleteSchedule(null)}
          title="Delete schedule?"
          description={deleteSchedule ? `Remove ${deleteSchedule.course?.code ?? deleteSchedule.courseCode} from the timetable?` : ''}
          icon={Trash2}
          confirmLabel="Delete"
          confirmVariant="destructive"
          onConfirm={handleDeleteSchedule}
          loading={deleteLoading}
        />

        {/* 8.2 Filter bar — desktop: white card rounded-xl padding 12px 20px; mobile: search + Filters(N) */}
        <div className="rounded-xl border border-gray-200 bg-white py-3 px-5">
          <div className="flex flex-row flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-0 md:min-w-[200px] md:hidden">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by course code or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>
            <div className="hidden md:flex items-center gap-3 flex-wrap">
              <Select value={selectedSessionId || 'all'} onValueChange={(v) => setSelectedSessionId(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Session" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                  <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.code} value={dept.code}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {levelOptions.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {viewMode === 'timetable' && (
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Days</SelectItem>
                    {dayOptions.filter((d) => [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY].includes(d.value)).map((day) => (
                      <SelectItem key={day.value} value={day.value}>
                        {day.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {filterCount > 0 && (
                <button
                  type="button"
                  className="text-sm text-gray-500 hover:text-gray-700"
                  onClick={handleReset}
                >
                  Clear Filters
                </button>
              )}
            </div>
            <Button variant="outline" size="sm" className="md:hidden shrink-0" onClick={() => setFiltersOpen(true)}>
              <Filter className="h-4 w-4 mr-2" />
              Filters {filterCount > 0 ? `(${filterCount})` : ''}
            </Button>
          </div>
        </div>

        {/* Mobile filters dialog */}
        <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
          <DialogContent className="md:max-w-[400px]" onSwipeDown={() => setFiltersOpen(false)}>
            <DialogHeader><DialogTitle>Filters</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Session</label>
                <Select value={selectedSessionId || 'all'} onValueChange={(v) => setSelectedSessionId(v === 'all' ? '' : v)}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Session" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sessions</SelectItem>
                    {sessions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Semester</label>
                <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Semester" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Semesters</SelectItem>
                    <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                    <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="All Departments" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept.code} value={dept.code}>{dept.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Level</label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="All Levels" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {levelOptions.map((level) => (
                      <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {viewMode === 'timetable' && (
                <div>
                  <label className="text-sm font-medium">Day</label>
                  <Select value={selectedDay} onValueChange={setSelectedDay}>
                    <SelectTrigger className="mt-1.5"><SelectValue placeholder="All Days" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Days</SelectItem>
                      {dayOptions.filter((d) => [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY].includes(d.value)).map((day) => (
                        <SelectItem key={day.value} value={day.value}>{day.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Per page</label>
                <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setCurrentPage(1); setFiltersOpen(false); }}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {filterCount > 0 && (
                <Button variant="outline" className="w-full" onClick={() => { handleReset(); setFiltersOpen(false); }}>
                  Clear Filters
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Content */}
        {fetchError ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <ErrorState entity="schedules" onRetry={() => { setFetchError(null); fetchSchedules(); }} />
          </div>
        ) : loading ? (
          <div
            className="grid gap-px bg-gray-200 rounded-xl overflow-hidden border border-gray-200"
            style={{
              gridTemplateColumns: '64px repeat(5, 1fr)',
              gridTemplateRows: '40px repeat(10, 60px)',
            }}
          >
            <div className="bg-gray-100" style={{ gridColumn: 1, gridRow: 1 }} />
            {[2, 3, 4, 5, 6].map((c) => (
              <div key={`h-${c}`} className="bg-gray-50" style={{ gridColumn: c, gridRow: 1 }} />
            ))}
            {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((r) => (
              <div key={`time-${r}`} className="bg-gray-50" style={{ gridColumn: 1, gridRow: r }} />
            ))}
            {[2, 3, 4, 5, 6].map((c) =>
              [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((r) => (
                <div key={`${c}-${r}`} className="bg-gray-50" style={{ gridColumn: c, gridRow: r }} />
              ))
            ).flat()}
            {/* Scattered skeleton blocks — §18.1 */}
            {[
              { col: 2, row: 2, span: 2, w: '85%' },
              { col: 3, row: 4, span: 2, w: '70%' },
              { col: 2, row: 6, span: 2, w: '90%' },
              { col: 4, row: 3, span: 2, w: '75%' },
              { col: 5, row: 5, span: 2, w: '65%' },
              { col: 2, row: 8, span: 2, w: '80%' },
              { col: 4, row: 7, span: 2, w: '60%' },
              { col: 6, row: 2, span: 2, w: '70%' },
              { col: 3, row: 9, span: 2, w: '85%' },
            ].map((b, i) => (
              <div
                key={i}
                className="bg-gray-200 animate-pulse rounded-lg"
                style={{
                  gridColumn: b.col,
                  gridRow: `${b.row} / span ${b.span}`,
                  width: b.w,
                  minHeight: 58,
                }}
              />
            ))}
          </div>
        ) : (
          <div className="relative">
            {refetching && <RefetchIndicator />}
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {filteredSchedules.length} of {schedules.length} schedules
              </p>
              {filteredSchedules.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      className="flex items-center gap-2"
                    >
                      <FileDown className="h-4 w-4" />
                      Export Timetable
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={exportAsPDF} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsXLSX} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as XLSX
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsCSV} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={exportAsPNG} className="cursor-pointer">
                      <FileText className="h-4 w-4 mr-2" />
                      Export as PNG
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {viewMode === 'list' ? (
              <Card className="rounded-xl border shadow-sm overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-white border-b sticky top-0 z-10">
                      <tr className="text-left text-sm text-gray-500">
                        <th className="p-3 cursor-pointer" onClick={() => setListSort((p) => ({ key: 'day', dir: p.key === 'day' ? (p.dir === 'asc' ? 'desc' : null) : 'asc' }))}>Day</th>
                        <th className="p-3 cursor-pointer" onClick={() => setListSort((p) => ({ key: 'time', dir: p.key === 'time' ? (p.dir === 'asc' ? 'desc' : null) : 'asc' }))}>Time</th>
                        <th className="p-3">Course Code</th>
                        <th className="p-3">Course Name</th>
                        <th className="p-3">Department</th>
                        <th className="p-3">Level</th>
                        <th className="p-3">Semester</th>
                        <th className="p-3">Type</th>
                        {canMutateSchedules && <th className="p-3 w-[80px]">Actions</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {[...filteredSchedules]
                        .sort((a, b) => {
                          const dir = listSort.dir === 'desc' ? -1 : 1
                          if (listSort.key === 'day') {
                            const cmp = (a.dayOfWeek + a.startTime).localeCompare(b.dayOfWeek + b.startTime)
                            return (listSort.dir ? cmp * dir : cmp) || a.startTime.localeCompare(b.startTime)
                          }
                          const cmp = a.startTime.localeCompare(b.startTime) || a.dayOfWeek.localeCompare(b.dayOfWeek)
                          return listSort.dir ? cmp * dir : cmp
                        })
                        .map((s) => (
                          <tr key={s.id} className="border-t hover:bg-gray-50">
                            <td className="p-3 text-sm">{dayLabels[s.dayOfWeek] ?? s.dayOfWeek}</td>
                            <td className="p-3 text-sm">{s.startTime} – {s.endTime}</td>
                            <td className="p-3"><span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{s.course?.code ?? s.courseCode}</span></td>
                            <td className="p-3 text-sm">{s.course?.name}</td>
                            <td className="p-3"><span className="text-xs font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{s.course?.departmentCode ?? '—'}</span></td>
                            <td className="p-3"><Badge variant="secondary" className="text-xs">{s.course?.level?.replace('LEVEL_', '') ?? '—'}</Badge></td>
                            <td className="p-3 text-sm">{s.semester === Semester.FIRST ? 'First' : 'Second'}</td>
                            <td className="p-3">
                              {s.isFixed ? <Badge className="bg-indigo-100 text-indigo-700 text-xs"><Lock className="h-3 w-3 mr-0.5 inline" />Fixed</Badge> : s.isManualOverride ? <Badge className="bg-amber-100 text-amber-700 text-xs">Manual ●</Badge> : <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600">Auto-generated</Badge>}
                            </td>
                            {canMutateSchedules && (
                              <td className="p-3">
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { setEditSchedule(s); setCreateModalOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                                  <Button size="icon" variant="ghost" className="h-9 w-9 text-red-600 hover:text-red-700" onClick={() => setDeleteSchedule(s)} disabled={s.isFixed && !isAdmin} title={s.isFixed && !isAdmin ? 'Fixed. Contact admin.' : undefined}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                              </td>
                            )}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden divide-y">
                  {[...filteredSchedules]
                    .sort((a, b) => {
                      const dir = listSort.dir === 'desc' ? -1 : 1
                      if (listSort.key === 'day') {
                        const cmp = (a.dayOfWeek + a.startTime).localeCompare(b.dayOfWeek + b.startTime)
                        return (listSort.dir ? cmp * dir : cmp) || a.startTime.localeCompare(b.startTime)
                      }
                      const cmp = a.startTime.localeCompare(b.startTime) || a.dayOfWeek.localeCompare(b.dayOfWeek)
                      return listSort.dir ? cmp * dir : cmp
                    })
                    .map((s) => {
                      const deptName = (s.course?.departmentCode && deptCodeToName[s.course.departmentCode]) ?? s.course?.departmentCode ?? '—'
                      const levelLabel = s.course?.level?.replace('LEVEL_', '') ?? '—'
                      return (
                      <div key={s.id} className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm">{dayLabels[s.dayOfWeek] ?? s.dayOfWeek} · {s.startTime} – {s.endTime}</p>
                          {s.isFixed ? <Badge className="bg-indigo-100 text-indigo-700 text-xs shrink-0"><Lock className="h-3 w-3 mr-0.5 inline" />Fixed</Badge> : s.isManualOverride ? <Badge className="bg-amber-100 text-amber-700 text-xs shrink-0">Manual ●</Badge> : <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-600 shrink-0">Auto-generated</Badge>}
                        </div>
                        <p className="text-sm text-gray-600 mt-0.5">
                          <span className="font-mono text-indigo-600">{s.course?.code ?? s.courseCode}</span> · {s.course?.name ?? '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{deptName} · {levelLabel !== '—' ? `${levelLabel} Level` : '—'}</p>
                        <div className="border-t mt-3 pt-3 flex justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost" className="h-9 w-9"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openScheduleDetail(s)}>View Details</DropdownMenuItem>
                              {canMutateSchedules && (
                                <>
                                  <DropdownMenuItem onClick={() => { setEditSchedule(s); setCreateModalOpen(true); }}>Edit Schedule</DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setDeleteSchedule(s)} disabled={s.isFixed && !isAdmin} className="text-red-600">Delete Schedule</DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    )})}
                </div>
                {filteredSchedules.length === 0 && (
                  <div className="p-12 text-center">
                    <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    {schedules.length === 0 ? (
                      <>
                        <h3 className="text-base font-semibold text-gray-700">No schedules this semester</h3>
                        <p className="text-sm text-gray-400 mt-2">Generate schedules or add them manually.</p>
                        {canMutateSchedules && (
                          <Button className="mt-5" onClick={() => setGenerateModalOpen(true)}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Generate Schedules
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <h3 className="text-base font-semibold text-gray-700">No schedules found</h3>
                        <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters.</p>
                      </>
                    )}
                  </div>
                )}
              </Card>
            ) : filteredSchedules.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="py-16 text-center">
                  <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                  {schedules.length === 0 ? (
                    <>
                      <h3 className="text-base font-semibold text-gray-700">No schedules this semester</h3>
                      <p className="text-sm text-gray-400 mt-2">Generate schedules or add them manually.</p>
                      {canMutateSchedules && (
                        <Button className="mt-5" onClick={() => setGenerateModalOpen(true)}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Generate Schedules
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <h3 className="text-base font-semibold text-gray-700">No schedules found</h3>
                      <p className="text-sm text-gray-400 mt-2">Try adjusting your search or filters.</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="hidden md:block">
                  <TimetableGrid
                    schedules={filteredSchedules}
                    onScheduleClick={openScheduleDetail}
                    onEmptyCellClick={canMutateSchedules ? (day, startTime) => { setCreateModalPrefill({ dayOfWeek: day, startTime }); setEditSchedule(null); setCreateModalOpen(true); } : undefined}
                    canMutate={canMutateSchedules}
                  />
                </div>
                <div className="md:hidden">
                  <MobileTimetable
                    schedules={filteredSchedules}
                    selectedDay={mobileSelectedDay}
                    onDayChange={setMobileSelectedDay}
                    onScheduleClick={openScheduleDetail}
                    onEmptySlotClick={canMutateSchedules ? (day, startTime) => { setCreateModalPrefill({ dayOfWeek: day, startTime }); setEditSchedule(null); setCreateModalOpen(true); } : undefined}
                    canMutate={canMutateSchedules}
                  />
                </div>
              </>
            )}

            {/* Pagination — §17 */}
            {total > 0 && (
              <Pagination
                page={currentPage}
                totalPages={Math.max(1, totalPages)}
                total={total}
                limit={limit}
                onPageChange={setCurrentPage}
                onLimitChange={(v) => { setLimit(v); setCurrentPage(1); }}
                resultsLabel="schedules"
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
