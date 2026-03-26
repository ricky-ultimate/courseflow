"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveSessionInvalidateCount } from "@/contexts/ActiveSessionContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Search,
  Clock,
  RefreshCw,
  FileText,
  Plus,
  FileDown,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import {
  Schedule,
  Department,
  Level,
  DayOfWeek,
  Semester,
  Course,
  AcademicSession,
} from "@/types";
import { GenerateScheduleModal } from "@/components/dashboard/generate-schedule-modal";
import { TimetableGrid } from "@/components/schedules/timetable-grid";
import { MobileTimetable } from "@/components/schedules/mobile-timetable";
import { ScheduleDetailSheet } from "@/components/schedules/schedule-detail-sheet";
import { CreateScheduleModal } from "@/components/schedules/create-schedule-modal";
import { UnscheduledCoursesPanel } from "@/components/schedules/unscheduled-courses-panel";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/state/error-state";
import { Pagination } from "@/components/ui/pagination";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportAsPDF,
  exportAsXLSX,
  exportAsCSV,
  exportAsPNG,
} from "@/lib/schedule-export";

const WEEKDAYS = [
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
  DayOfWeek.SUNDAY,
];

const levelOptions = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

const dayOptions = [
  { value: DayOfWeek.MONDAY, label: "Monday" },
  { value: DayOfWeek.TUESDAY, label: "Tuesday" },
  { value: DayOfWeek.WEDNESDAY, label: "Wednesday" },
  { value: DayOfWeek.THURSDAY, label: "Thursday" },
  { value: DayOfWeek.FRIDAY, label: "Friday" },
  { value: DayOfWeek.SATURDAY, label: "Saturday" },
  { value: DayOfWeek.SUNDAY, label: "Sunday" },
];

const dayLabels: Record<DayOfWeek, string> = Object.fromEntries(
  dayOptions.map((d) => [d.value, d.label]),
) as Record<DayOfWeek, string>;

export default function SchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isAdmin, isHod, user } = useAuth();
  const { toast } = useToast();
  const activeSessionInvalidateCount = useActiveSessionInvalidateCount();
  const canMutateSchedules = isAdmin || isHod;

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<"timetable" | "agenda">("agenda");
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null);
  const openForDetailScheduleIdRef = useRef<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalPrefill, setCreateModalPrefill] = useState<{
    courseCode?: string;
    dayOfWeek?: DayOfWeek;
    startTime?: string;
  }>({});
  const [mobileSelectedDay, setMobileSelectedDay] = useState<DayOfWeek>(
    DayOfWeek.MONDAY,
  );
  const [deleteSchedule, setDeleteSchedule] = useState<Schedule | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editSchedule, setEditSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const hasFetchedRef = useRef(false);
  usePageLoadReporter(loading);
  const defaultFiltersApplied = useRef(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("CSC");
  const [selectedLevel, setSelectedLevel] = useState<string>("LEVEL_300");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("FIRST");
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [unscheduledKey, setUnscheduledKey] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, sessRes, activeRes] = await Promise.all([
          apiClient.getDepartments({ limit: 10000 }),
          apiClient.getAcademicSessions({ limit: 10000 }),
          apiClient.getActiveAcademicSession(),
        ]);
        const d = getItemsFromResponse<Department>(deptRes);
        const s = getItemsFromResponse<AcademicSession>(sessRes);
        if (d) setDepartments(d.items);
        if (s) setSessions(s.items);
        if (activeRes.success && activeRes.data) {
          const act = activeRes.data as AcademicSession;
          setActiveSession(act);
          setSelectedSessionId(act.id);
        } else if (s?.items?.length) {
          setSelectedSessionId(s.items[0]!.id);
        }
      } catch (e) {
        console.error("Failed to fetch:", e);
      }
    };
    fetchData();
  }, [activeSessionInvalidateCount]);

  useEffect(() => {
    if (!defaultFiltersApplied.current && sessions.length > 0 && !loading) {
      const cscDept = departments.find(
        (d) =>
          d.code === "CS" ||
          d.code === "CSC" ||
          d.name.toLowerCase().includes("computer"),
      );
      if (cscDept) setSelectedDepartment(cscDept.code);
      else if (departments.length > 0)
        setSelectedDepartment(departments[0]!.code);
      defaultFiltersApplied.current = true;
    }
  }, [sessions, departments, loading]);

  const fetchSchedules = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefetching(true);
      setFetchError(null);
      const params: Record<string, unknown> = { page: currentPage, limit };
      if (selectedDepartment && selectedDepartment !== "all")
        params.departmentCode = selectedDepartment;
      if (selectedLevel && selectedLevel !== "all")
        params.level = selectedLevel;
      if (selectedDay && selectedDay !== "all") params.dayOfWeek = selectedDay;
      if (selectedSemester && selectedSemester !== "all")
        params.semester = selectedSemester;
      if (selectedSessionId && selectedSessionId !== "all")
        params.sessionId = selectedSessionId;
      const response = await apiClient.getSchedules(params);
      const result = getItemsFromResponse<Schedule>(response);
      if (result) {
        setSchedules(result.items);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      }
    } catch (error) {
      console.error("Failed to fetch schedules:", error);
      setFetchError("Failed to load schedules");
    } finally {
      setLoading(false);
      setRefetching(false);
      hasFetchedRef.current = true;
    }
  }, [
    currentPage,
    limit,
    selectedDepartment,
    selectedLevel,
    selectedDay,
    selectedSemester,
    selectedSessionId,
  ]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  useEffect(() => {
    const create = searchParams.get("create");
    const course = searchParams.get("course");
    const day = searchParams.get("day") as DayOfWeek | null;
    const start = searchParams.get("start");
    if (create === "1" && canMutateSchedules) {
      setCreateModalOpen(true);
      setCreateModalPrefill({
        courseCode: course ?? undefined,
        dayOfWeek: day ?? undefined,
        startTime: start ?? undefined,
      });
    }
  }, [searchParams, canMutateSchedules]);

  const openScheduleDetail = useCallback(
    async (s: Schedule) => {
      openForDetailScheduleIdRef.current = s.id;
      setDetailSchedule(s);
      try {
        const res = await apiClient.getScheduleById(s.id);
        if (openForDetailScheduleIdRef.current !== s.id) return;
        if (res.success && res.data) setDetailSchedule(res.data as Schedule);
      } catch {
        if (openForDetailScheduleIdRef.current === s.id)
          toast({
            title: "Failed to load schedule details",
            variant: "destructive",
          });
      }
    },
    [toast],
  );

  const handleDeleteSchedule = async (): Promise<boolean> => {
    if (!deleteSchedule) return false;
    try {
      setDeleteLoading(true);
      const res = await apiClient.deleteSchedule(deleteSchedule.id);
      if (res.success) {
        toast({ title: "Schedule deleted." });
        setDeleteSchedule(null);
        openForDetailScheduleIdRef.current = null;
        setDetailSchedule(null);
        fetchSchedules();
        setUnscheduledKey((k) => k + 1);
        return true;
      }
      toast({ title: (res as any).error ?? "Failed", variant: "destructive" });
      return false;
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleScheduleCreated = useCallback(() => {
    fetchSchedules();
    setUnscheduledKey((k) => k + 1);
  }, [fetchSchedules]);

  const fetchAllSchedulesForExport = async (): Promise<Schedule[]> => {
    try {
      const params: Record<string, unknown> = { page: 1, limit: 10000 };
      if (selectedDepartment && selectedDepartment !== "all")
        params.departmentCode = selectedDepartment;
      if (selectedLevel && selectedLevel !== "all")
        params.level = selectedLevel;
      if (selectedDay && selectedDay !== "all") params.dayOfWeek = selectedDay;
      if (searchTerm) params.searchTerm = searchTerm;
      const response = await apiClient.getSchedules(params);
      const result = getItemsFromResponse<Schedule>(response);
      let allSchedules = result?.items ?? [];
      const courseCodes = Array.from(
        new Set(allSchedules.map((s) => s.courseCode).filter(Boolean)),
      );
      if (courseCodes.length > 0) {
        try {
          const coursesResponse = await apiClient.getCourses({ limit: 10000 });
          const coursesResult = getItemsFromResponse<Course>(coursesResponse);
          const courses = coursesResult?.items ?? [];
          if (courses.length > 0) {
            const courseMap = new Map<string, Course>();
            courses.forEach(
              (course) => course.code && courseMap.set(course.code, course),
            );
            allSchedules = allSchedules.map((schedule) => {
              if (schedule.courseCode && courseMap.has(schedule.courseCode)) {
                const enriched = courseMap.get(schedule.courseCode)!;
                if (schedule.course)
                  return {
                    ...schedule,
                    course: {
                      ...schedule.course,
                      lecturer: enriched.lecturer ?? schedule.course.lecturer,
                    },
                  } as Schedule;
              }
              return schedule;
            });
          }
        } catch (error) {
          console.warn("Failed to fetch courses for lecturer info:", error);
        }
      }
      return allSchedules;
    } catch {
      return filteredSchedules.length > 0 ? filteredSchedules : [];
    }
  };

  const runExport = async (
    fn: (s: Schedule[]) => Promise<void>,
    label: string,
  ) => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      });
      const allSchedules = await fetchAllSchedulesForExport();
      if (!allSchedules.length) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        });
        return;
      }
      await fn(allSchedules);
      toast({
        title: "Export Successful",
        description: `Timetable exported as ${label} (${allSchedules.length} schedules)`,
      });
    } catch {
      toast({
        title: "Export Error",
        description: `An error occurred while exporting ${label}`,
        variant: "destructive",
      });
    }
  };

  const filteredSchedules = schedules.filter(
    (schedule) =>
      schedule.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schedule.course?.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleReset = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setSelectedLevel("all");
    setSelectedDay("all");
    setSelectedSemester("all");
    setSelectedSessionId("");
    setCurrentPage(1);
  };

  const filterCount = [
    selectedSessionId && selectedSessionId !== "all",
    selectedSemester !== "all",
    selectedDepartment !== "all",
    selectedLevel !== "all",
    viewMode === "timetable" && selectedDay !== "all",
  ].filter(Boolean).length;

  const groupedSchedules = WEEKDAYS.map((day) => ({
    day,
    schedules: filteredSchedules
      .filter((s) => s.dayOfWeek === day)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  })).filter((g) => g.schedules.length > 0);

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1.5">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
            Schedules
          </h1>
          {(activeSession || selectedSessionId) && (
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Calendar className="h-4 w-4" />
              <span>
                {(
                  sessions.find((x) => x.id === selectedSessionId) ??
                  activeSession
                )?.name ?? "Session"}
              </span>
              <span className="text-slate-300">•</span>
              <span>
                {selectedSemester === Semester.FIRST
                  ? "First Semester"
                  : selectedSemester === Semester.SECOND
                    ? "Second Semester"
                    : "All Semesters"}
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100/80 p-1 rounded-xl shadow-inner border border-slate-200/50 mr-2">
            <button
              onClick={() => setViewMode("agenda")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === "agenda" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              Agenda
            </button>
            <button
              onClick={() => setViewMode("timetable")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${viewMode === "timetable" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
            >
              Grid
            </button>
          </div>
          {canMutateSchedules && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full px-4"
                onClick={() => {
                  setEditSchedule(null);
                  setCreateModalPrefill({});
                  setCreateModalOpen(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Manual
              </Button>
              <Button
                size="sm"
                className="rounded-full px-4 bg-indigo-600 hover:bg-indigo-700"
                onClick={() => setGenerateModalOpen(true)}
              >
                <RefreshCw className="h-4 w-4 mr-1.5" />
                Auto-Generate
              </Button>
            </>
          )}
        </div>
      </div>

      {canMutateSchedules && (
        <UnscheduledCoursesPanel
          key={unscheduledKey}
          onAddSchedule={(courseCode) => {
            setEditSchedule(null);
            setCreateModalPrefill({ courseCode });
            setCreateModalOpen(true);
          }}
        />
      )}

      <GenerateScheduleModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onSuccess={handleScheduleCreated}
        isHod={!!isHod}
        departmentCode={
          isHod && user?.departmentCode ? user.departmentCode : undefined
        }
        departmentName={
          isHod && user?.departmentCode
            ? departments.find((d) => d.code === user.departmentCode)?.name
            : undefined
        }
      />
      <CreateScheduleModal
        open={createModalOpen}
        onOpenChange={(o) => {
          if (!o) setEditSchedule(null);
          setCreateModalOpen(o);
        }}
        onSuccess={handleScheduleCreated}
        prefill={createModalPrefill}
        editSchedule={editSchedule}
        activeSessionId={selectedSessionId || activeSession?.id}
        existingSchedules={schedules}
      />
      <ScheduleDetailSheet
        schedule={detailSchedule}
        sessionName={
          sessions.find((s) => s.id === detailSchedule?.sessionId)?.name
        }
        onClose={() => {
          openForDetailScheduleIdRef.current = null;
          setDetailSchedule(null);
        }}
        onEdit={(s) => {
          openForDetailScheduleIdRef.current = null;
          setDetailSchedule(null);
          setEditSchedule(s);
          setCreateModalOpen(true);
        }}
        onDelete={(s) => setDeleteSchedule(s)}
        onFixedToggled={(updated) => {
          setDetailSchedule(updated);
          setSchedules((prev) =>
            prev.map((s) => (s.id === updated.id ? { ...updated } : s)),
          );
        }}
        canMutate={canMutateSchedules}
        isAdmin={isAdmin}
      />
      <ConfirmDialog
        open={!!deleteSchedule}
        onOpenChange={(o) => !o && setDeleteSchedule(null)}
        title="Delete schedule?"
        description={
          deleteSchedule
            ? `Remove ${deleteSchedule.course?.code ?? deleteSchedule.courseCode} from the timetable?`
            : ""
        }
        icon={Trash2}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDeleteSchedule}
        loading={deleteLoading}
      />

      <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm w-full">
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
          <Select
            value={selectedSessionId || "all"}
            onValueChange={(v) => setSelectedSessionId(v === "all" ? "" : v)}
          >
            <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[140px]">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sessions</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSemester} onValueChange={setSelectedSemester}>
            <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[130px]">
              <SelectValue placeholder="Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              <SelectItem value={Semester.FIRST}>First</SelectItem>
              <SelectItem value={Semester.SECOND}>Second</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={selectedDepartment}
            onValueChange={setSelectedDepartment}
          >
            <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[140px]">
              <SelectValue placeholder="Department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept.code} value={dept.code}>
                  {dept.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[110px]">
              <SelectValue placeholder="Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {levelOptions.map((lvl) => (
                <SelectItem key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filterCount > 0 && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-500 hover:text-slate-800 ml-2 px-2 whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {fetchError ? (
        <ErrorState
          entity="schedules"
          onRetry={() => {
            setFetchError(null);
            fetchSchedules();
          }}
        />
      ) : loading ? (
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-slate-200 rounded-lg w-1/4" />
          <div className="h-64 bg-slate-200 rounded-2xl" />
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">
              Showing {filteredSchedules.length} classes
            </p>
            {filteredSchedules.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full shadow-sm"
                  >
                    <FileDown className="h-4 w-4 mr-2 text-slate-500" />
                    Export
                    <ChevronDown className="h-3 w-3 ml-2 text-slate-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-xl shadow-lg"
                >
                  <DropdownMenuItem
                    onClick={() => runExport(exportAsPDF, "PDF")}
                    className="cursor-pointer py-2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    PDF Document
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => runExport(exportAsXLSX, "XLSX")}
                    className="cursor-pointer py-2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Excel (XLSX)
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => runExport(exportAsCSV, "CSV")}
                    className="cursor-pointer py-2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    CSV File
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => runExport(exportAsPNG, "PNG")}
                    className="cursor-pointer py-2"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Image (PNG)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {filteredSchedules.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center">
              <Clock className="h-16 w-16 text-slate-200 mb-6" />
              <h3 className="text-lg font-semibold text-slate-900">
                No schedules to display
              </h3>
              <p className="text-slate-500 mt-2 max-w-md">
                No classes scheduled for the selected parameters. Adjust your
                filters or generate a new timetable.
              </p>
            </div>
          ) : viewMode === "agenda" ? (
            <div className="space-y-10">
              {groupedSchedules.map(({ day, schedules: daySchedules }) => (
                <div key={day} className="space-y-4">
                  <div className="sticky top-[56px] z-20 bg-gray-50/95 backdrop-blur-sm py-3 border-b border-slate-200/60">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">
                      {dayLabels[day]}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {daySchedules.map((s) => (
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
                              {s.course?.level?.replace("LEVEL_", "") ?? "—"}{" "}
                              Lvl
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
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
                  onEmptyCellClick={
                    canMutateSchedules
                      ? (day, startTime) => {
                          setCreateModalPrefill({ dayOfWeek: day, startTime });
                          setEditSchedule(null);
                          setCreateModalOpen(true);
                        }
                      : undefined
                  }
                  canMutate={canMutateSchedules}
                />
              </div>
              <div className="md:hidden">
                <MobileTimetable
                  schedules={filteredSchedules}
                  selectedDay={mobileSelectedDay}
                  onDayChange={setMobileSelectedDay}
                  onScheduleClick={openScheduleDetail}
                  onEmptySlotClick={
                    canMutateSchedules
                      ? (day, startTime) => {
                          setCreateModalPrefill({ dayOfWeek: day, startTime });
                          setEditSchedule(null);
                          setCreateModalOpen(true);
                        }
                      : undefined
                  }
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
                onLimitChange={(v) => {
                  setLimit(v);
                  setCurrentPage(1);
                }}
                resultsLabel="schedules"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
