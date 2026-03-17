'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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

const WEEKDAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY, DayOfWeek.SUNDAY]

export default function SchedulePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isAdmin, isLecturer, isHod, user } = useAuth()
  const { toast } = useToast()
  const activeSessionInvalidateCount = useActiveSessionInvalidateCount()

  const canMutateSchedules = isAdmin || isHod
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [sessions, setSessions] = useState<AcademicSession[]>([])
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(null)

  const [viewMode, setViewMode] = useState<'timetable' | 'agenda'>('agenda')
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null)
  const openForDetailScheduleIdRef = useRef<string | null>(null)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [createModalPrefill, setCreateModalPrefill] = useState<{ courseCode?: string; dayOfWeek?: DayOfWeek; startTime?: string }>({})
  const [mobileSelectedDay, setMobileSelectedDay] = useState<DayOfWeek>(DayOfWeek.MONDAY)
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null)
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
    { value: DayOfWeek.MONDAY, label: 'Monday', shortLabel: 'MON' },
    { value: DayOfWeek.TUESDAY, label: 'Tuesday', shortLabel: 'TUE' },
    { value: DayOfWeek.WEDNESDAY, label: 'Wednesday', shortLabel: 'WED' },
    { value: DayOfWeek.THURSDAY, label: 'Thursday', shortLabel: 'THU' },
    { value: DayOfWeek.FRIDAY, label: 'Friday', shortLabel: 'FRI' },
    { value: DayOfWeek.SATURDAY, label: 'Saturday', shortLabel: 'SAT' },
    { value: DayOfWeek.SUNDAY, label: 'Sunday', shortLabel: 'SUN' },
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, sessRes, activeRes] = await Promise.all([
          apiClient.getDepartments({ limit: 10000 }),
          apiClient.getAcademicSessions({ limit: 10000 }),
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
      const params: any = { page: currentPage, limit }

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

  const getTimeSlots = (scheds: Schedule[]): string[] => {
    const timeSet = new Set<string>()
    scheds.forEach(schedule => timeSet.add(`${schedule.startTime}-${schedule.endTime}`))
    return Array.from(timeSet).sort((a, b) => a.split('-')[0].localeCompare(b.split('-')[0]))
  }

  const formatTimeSlot = (startTime: string, endTime: string): string => {
    try {
      const startHour = parseInt(startTime.split(':')[0])
      const endHour = parseInt(endTime.split(':')[0])
      const startAMPM = startHour >= 12 ? 'PM' : 'AM'
      const endAMPM = endHour >= 12 ? 'PM' : 'AM'
      const dispStart = startHour % 12 || 12
      const dispEnd = endHour % 12 || 12

      if (startAMPM === endAMPM) return `${dispStart}-${dispEnd} (${startAMPM})`
      return `${dispStart}${startAMPM}-${dispEnd}${endAMPM}`
    } catch {
      return `${startTime} - ${endTime}`
    }
  }

  // Shared helper: build the grid + courseMap from a schedule list
  const buildExportData = (allSchedules: Schedule[]) => {
    const timeSlots = getTimeSlots(allSchedules)
    const grid: Record<string, Record<string, { code: string }[]>> = {}

    dayOptions.forEach(day => {
      grid[day.value] = {}
      timeSlots.forEach(ts => (grid[day.value][ts] = []))
    })

    allSchedules.forEach(s => {
      const ts = `${s.startTime}-${s.endTime}`
      if (!grid[s.dayOfWeek]) grid[s.dayOfWeek] = {}
      if (!grid[s.dayOfWeek][ts]) grid[s.dayOfWeek][ts] = []
      grid[s.dayOfWeek][ts].push({ code: s.course?.code || 'N/A' })
    })

    const courseMap = new Map<string, { code: string; title: string; lecturer: string; units: number; status: string }>()
    allSchedules.forEach(s => {
      if (!s.course) return
      if (!courseMap.has(s.course.code)) {
        courseMap.set(s.course.code, {
          code: s.course.code,
          title: s.course.name,
          lecturer: s.course.lecturer?.name || s.course.lecturer?.email || 'N/A',
          units: s.course.credits,
          status: 'C',
        })
      }
    })

    const courseDetails = Array.from(courseMap.values()).sort((a, b) => a.code.localeCompare(b.code))
    const timeHeaders = ['Day', ...timeSlots.map(ts => formatTimeSlot(ts.split('-')[0], ts.split('-')[1]))]

    const timetableRows = dayOptions.map(day => {
      const row: string[] = [day.shortLabel || day.label]
      timeSlots.forEach(ts => {
        const scheds = grid[day.value]?.[ts] || []
        row.push(scheds.length > 0 ? scheds.map(x => x.code).join(' / ') : '')
      })
      return row
    })

    return { timeSlots, grid, courseDetails, timeHeaders, timetableRows }
  }

  const fetchAllSchedulesForExport = async (): Promise<Schedule[]> => {
    try {
      const params: Record<string, unknown> = { page: 1, limit: 10000 }
      if (selectedDepartment && selectedDepartment !== 'all') params.departmentCode = selectedDepartment
      if (selectedLevel && selectedLevel !== 'all') params.level = selectedLevel
      if (selectedDay && selectedDay !== 'all') params.dayOfWeek = selectedDay
      if (searchTerm) params.searchTerm = searchTerm

      const response = await apiClient.getSchedules(params)
      const result = getItemsFromResponse<Schedule>(response)
      let allSchedules = result?.items ?? []

      const courseCodes = Array.from(new Set(allSchedules.map(s => s.courseCode).filter(Boolean)))
      if (courseCodes.length > 0) {
        try {
          const coursesResponse = await apiClient.getCourses({ limit: 10000 })
          const coursesResult = getItemsFromResponse<Course>(coursesResponse)
          const courses = coursesResult?.items ?? []
          if (courses.length > 0) {
            const courseMap = new Map<string, any>()
            courses.forEach(course => course.code && courseMap.set(course.code, course))
            allSchedules = allSchedules.map(schedule => {
              if (schedule.courseCode && courseMap.has(schedule.courseCode)) {
                const enrichedCourse = courseMap.get(schedule.courseCode)
                if (schedule.course && enrichedCourse) {
                  return { ...schedule, course: { ...schedule.course, lecturer: enrichedCourse.lecturer || schedule.course.lecturer } } as Schedule
                }
              }
              return schedule
            })
          }
        } catch (error) {
          console.warn('Failed to fetch courses for lecturer info:', error)
        }
      }
      return allSchedules
    } catch (error) {
      console.error('Failed to fetch all schedules:', error)
      return filteredSchedules.length > 0 ? filteredSchedules : []
    }
  }

  const exportAsPDF = async () => {
    try {
      toast({ title: "Preparing Export", description: "Fetching all schedules..." })
      const allSchedules = await fetchAllSchedulesForExport()
      if (!allSchedules || allSchedules.length === 0) {
        toast({ title: "No Schedules", description: "There are no schedules to export", variant: "destructive" })
        return
      }

      const { courseDetails, timeHeaders, timetableRows } = buildExportData(allSchedules)
      const doc = new jsPDF('landscape', 'mm', 'a4')

      autoTable(doc, {
        head: [timeHeaders],
        body: timetableRows,
        startY: 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        margin: { top: 20 },
      })

      autoTable(doc, {
        head: [['S/NO.', 'COURSE CODE', 'COURSE TITLE', 'LECTURER', 'UNITS', 'STATUS']],
        body: courseDetails.map((c, i) => [(i + 1).toString(), c.code, c.title, c.lecturer, c.units.toString(), c.status]),
        startY: (doc as any).lastAutoTable.finalY + 20,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
      })

      doc.save(`timetable_${new Date().toISOString().split('T')[0]}.pdf`)
      toast({ title: "Export Successful", description: `Timetable exported as PDF (${allSchedules.length} schedules)` })
    } catch (error) {
      console.error('PDF export failed:', error)
      toast({ title: "Export Error", description: "An error occurred while exporting PDF", variant: "destructive" })
    }
  }

  const exportAsXLSX = async () => {
    try {
      toast({ title: "Preparing Export", description: "Fetching all schedules..." })
      const allSchedules = await fetchAllSchedulesForExport()
      if (!allSchedules || allSchedules.length === 0) {
        toast({ title: "No Schedules", description: "There are no schedules to export", variant: "destructive" })
        return
      }

      const { courseDetails, timeHeaders, timetableRows } = buildExportData(allSchedules)
      const wb = XLSX.utils.book_new()

      const ws1 = XLSX.utils.aoa_to_sheet([timeHeaders, ...timetableRows])
      XLSX.utils.book_append_sheet(wb, ws1, 'Timetable')

      const ws2 = XLSX.utils.aoa_to_sheet([
        ['S/NO.', 'COURSE CODE', 'COURSE TITLE', 'LECTURER', 'UNITS', 'STATUS'],
        ...courseDetails.map((c, i) => [i + 1, c.code, c.title, c.lecturer, c.units, c.status]),
      ])
      XLSX.utils.book_append_sheet(wb, ws2, 'Course Details')

      XLSX.writeFile(wb, `timetable_${new Date().toISOString().split('T')[0]}.xlsx`)
      toast({ title: "Export Successful", description: `Timetable exported as XLSX (${allSchedules.length} schedules)` })
    } catch (error) {
      console.error('XLSX export failed:', error)
      toast({ title: "Export Error", description: "An error occurred while exporting XLSX", variant: "destructive" })
    }
  }

  const exportAsCSV = async () => {
    try {
      toast({ title: "Preparing Export", description: "Fetching all schedules..." })
      const allSchedules = await fetchAllSchedulesForExport()
      if (!allSchedules || allSchedules.length === 0) {
        toast({ title: "No Schedules", description: "There are no schedules to export", variant: "destructive" })
        return
      }

      const { courseDetails, timeHeaders, timetableRows } = buildExportData(allSchedules)

      let csvContent = 'TIMETABLE\n'
      csvContent += timeHeaders.map(h => `"${h}"`).join(',') + '\n'
      timetableRows.forEach(row => {
        csvContent += row.map(cell => `"${cell}"`).join(',') + '\n'
      })

      csvContent += '\n\nCOURSE DETAILS\n'
      csvContent += '"S/NO.","COURSE CODE","COURSE TITLE","LECTURER","UNITS","STATUS"\n'
      courseDetails.forEach((c, i) => {
        csvContent += `"${i + 1}","${c.code}","${c.title}","${c.lecturer}","${c.units}","${c.status}"\n`
      })

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `timetable_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast({ title: "Export Successful", description: `Timetable exported as CSV (${allSchedules.length} schedules)` })
    } catch (error) {
      console.error('CSV export failed:', error)
      toast({ title: "Export Error", description: "An error occurred while exporting CSV", variant: "destructive" })
    }
  }

  const exportAsPNG = async () => {
    try {
      toast({ title: "Preparing Export", description: "Fetching all schedules..." })
      const allSchedules = await fetchAllSchedulesForExport()
      if (!allSchedules || allSchedules.length === 0) {
        toast({ title: "No Schedules", description: "There are no schedules to export", variant: "destructive" })
        return
      }

      const { courseDetails, timeHeaders, timetableRows } = buildExportData(allSchedules)

      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.width = '1200px'
      container.style.backgroundColor = 'white'
      container.style.padding = '20px'
      document.body.appendChild(container)

      container.innerHTML = `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="text-align: center; margin-bottom: 20px;">ACADEMIC TIMETABLE</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; font-size: 10px;">
            <thead>
              <tr style="background-color: #4285F4; color: white;">
                ${timeHeaders.map(h => `<th style="border: 1px solid #000; padding: 8px; text-align: center;">${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${timetableRows.map(row =>
                `<tr>${row.map((cell, i) =>
                  `<td style="border: 1px solid #000; padding: 8px; text-align: center;${i === 0 ? ' font-weight: bold;' : ''}">${cell}</td>`
                ).join('')}</tr>`
              ).join('')}
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
              ${courseDetails.map((c, i) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${i + 1}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${c.code}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${c.title}</td>
                  <td style="border: 1px solid #000; padding: 8px;">${c.lecturer}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${c.units}</td>
                  <td style="border: 1px solid #000; padding: 8px; text-align: center;">${c.status}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      `

      const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', logging: false })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `timetable_${new Date().toISOString().split('T')[0]}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      document.body.removeChild(container)

      toast({ title: "Export Successful", description: `Timetable exported as PNG (${allSchedules.length} schedules)` })
    } catch (error) {
      console.error('PNG export failed:', error)
      toast({ title: "Export Error", description: "An error occurred while exporting PNG", variant: "destructive" })
    }
  }

  const groupedSchedules = WEEKDAYS.map(day => ({
    day,
    schedules: filteredSchedules
      .filter(s => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  })).filter(g => g.schedules.length > 0)

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-10 animate-in fade-in duration-500">

      {/* 1. Sleek Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">Schedules</h1>
          {(activeSession || selectedSessionId) && (
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>{(sessions.find((x) => x.id === selectedSessionId) ?? activeSession)?.name ?? 'Session'}</span>
              <span className="text-slate-300">•</span>
              <span>{selectedSemester === Semester.FIRST ? 'First Semester' : selectedSemester === Semester.SECOND ? 'Second Semester' : 'All Semesters'}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/50 mr-2">
            <button
              onClick={() => setViewMode('agenda')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'agenda' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Agenda
            </button>
            <button
              onClick={() => setViewMode('timetable')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === 'timetable' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Grid
            </button>
          </div>
          {canMutateSchedules && (
            <>
              <Button size="sm" variant="outline" className="rounded-full px-4" onClick={() => { setEditSchedule(null); setCreateModalPrefill({}); setCreateModalOpen(true); }}>
                <Plus className="h-4 w-4 mr-1.5" />
                Manual
              </Button>
              <Button size="sm" className="rounded-full px-4 bg-indigo-600 hover:bg-indigo-700" onClick={() => setGenerateModalOpen(true)}>
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Auto-Generate
              </Button>
            </>
          )}
        </div>
      </div>

      <GenerateScheduleModal open={generateModalOpen} onOpenChange={setGenerateModalOpen} onSuccess={fetchSchedules} isHod={!!isHod} departmentCode={isHod && user?.departmentCode ? user.departmentCode : undefined} departmentName={isHod && user?.departmentCode ? departments.find((d) => d.code === user.departmentCode)?.name : undefined} />
      <CreateScheduleModal open={createModalOpen} onOpenChange={(o) => { if (!o) setEditSchedule(null); setCreateModalOpen(o) }} onSuccess={fetchSchedules} prefill={createModalPrefill} editSchedule={editSchedule} activeSessionId={selectedSessionId || activeSession?.id} existingSchedules={schedules} />
      <ScheduleDetailSheet schedule={detailSchedule} sessionName={sessions.find((s) => s.id === detailSchedule?.sessionId)?.name} onClose={() => { openForDetailScheduleIdRef.current = null; setDetailSchedule(null); }} onEdit={(s) => { openForDetailScheduleIdRef.current = null; setDetailSchedule(null); setEditSchedule(s); setCreateModalOpen(true); }} onDelete={(s) => setDeleteSchedule(s)} canMutate={canMutateSchedules} isAdmin={isAdmin} />
      <ConfirmDialog open={!!deleteSchedule} onOpenChange={(o) => !o && setDeleteSchedule(null)} title="Delete schedule?" description={deleteSchedule ? `Remove ${deleteSchedule.course?.code ?? deleteSchedule.courseCode} from the timetable?` : ''} icon={Trash2} confirmLabel="Delete" confirmVariant="destructive" onConfirm={handleDeleteSchedule} loading={deleteLoading} />

      {/* 2. Unified Minimalist Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm w-full transition-all">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search courses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-0 bg-transparent shadow-none focus-visible:ring-0 pl-9 h-10 w-full"
          />
        </div>
        <div className="h-6 w-px bg-slate-200 hidden sm:block" />
        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar px-1">
          <Select value={selectedSessionId || 'all'} onValueChange={(v) => setSelectedSessionId(v === 'all' ? '' : v)}>
            <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[140px]"><SelectValue placeholder="Session" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[130px]"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              <SelectItem value={Semester.FIRST}>First</SelectItem>
              <SelectItem value={Semester.SECOND}>Second</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[140px]"><SelectValue placeholder="Department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => <SelectItem key={dept.code} value={dept.code}>{dept.code}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[110px]"><SelectValue placeholder="Level" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levelOptions.map((lvl) => <SelectItem key={lvl.value} value={lvl.value}>{lvl.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {filterCount > 0 && (
            <button onClick={handleReset} className="text-xs text-slate-500 hover:text-slate-800 ml-2 px-2 whitespace-nowrap">Clear</button>
          )}
        </div>
      </div>

      {/* 3. Main Content Area */}
      {fetchError ? (
        <ErrorState entity="schedules" onRetry={() => { setFetchError(null); fetchSchedules(); }} />
      ) : loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
          <div className="h-64 bg-slate-200 rounded-2xl"></div>
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}

          {/* Export & Meta row */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Showing {filteredSchedules.length} classes
            </p>
            {filteredSchedules.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-full shadow-sm">
                    <FileDown className="h-4 w-4 mr-2 text-slate-500" />
                    Export
                    <ChevronDown className="h-3 w-3 ml-2 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
                  <DropdownMenuItem onClick={exportAsPDF} className="cursor-pointer py-2"><FileText className="h-4 w-4 mr-2" /> PDF Document</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAsXLSX} className="cursor-pointer py-2"><FileText className="h-4 w-4 mr-2" /> Excel (XLSX)</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAsCSV} className="cursor-pointer py-2"><FileText className="h-4 w-4 mr-2" /> CSV File</DropdownMenuItem>
                  <DropdownMenuItem onClick={exportAsPNG} className="cursor-pointer py-2"><FileText className="h-4 w-4 mr-2" /> Image (PNG)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Empty State */}
          {filteredSchedules.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center">
              <Clock className="h-16 w-16 text-slate-200 mb-6" />
              <h3 className="text-lg font-semibold text-slate-900">No schedules to display</h3>
              <p className="text-slate-500 mt-2 max-w-md">There are no classes scheduled for the selected parameters. Adjust your filters or generate a new timetable.</p>
            </div>
          ) : viewMode === 'agenda' ? (
            <div className="space-y-10">
              {groupedSchedules.map(({ day, schedules }) => (
                <div key={day} className="space-y-4">
                  <div className="sticky top-[56px] z-20 bg-gray-50/95 backdrop-blur-sm py-3 border-b border-slate-200/60">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">{dayLabels[day]}</h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {schedules.map(s => {
                      const levelLabel = s.course?.level?.replace('LEVEL_', '') ?? '—'
                      return (
                        <div
                          key={s.id}
                          onClick={() => openScheduleDetail(s)}
                          className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-l-2xl opacity-80" />
                          <div className="flex justify-between items-start mb-3 pl-2">
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                              {s.startTime} – {s.endTime}
                            </span>
                            <div className="flex gap-1">
                              {s.isFixed && <Lock className="h-3.5 w-3.5 text-slate-400" />}
                              {s.isManualOverride && <div className="h-2 w-2 rounded-full bg-amber-400 mt-1" title="Manual" />}
                            </div>
                          </div>
                          <div className="pl-2">
                            <h3 className="font-bold text-slate-900 text-lg leading-tight tracking-tight mb-1">{s.course?.code ?? s.courseCode}</h3>
                            <p className="text-sm text-slate-500 line-clamp-1 mb-4">{s.course?.name ?? '—'}</p>
                            <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
                              <span className="uppercase tracking-wider">{s.course?.departmentCode ?? '—'}</span>
                              <span className="w-1 h-1 rounded-full bg-slate-300" />
                              <span>{levelLabel} Lvl</span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
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

          {total > 0 && (
            <div className="mt-8">
              <Pagination
                page={currentPage}
                totalPages={Math.max(1, totalPages)}
                total={total}
                limit={limit}
                onPageChange={setCurrentPage}
                onLimitChange={(v) => { setLimit(v); setCurrentPage(1); }}
                resultsLabel="schedules"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
