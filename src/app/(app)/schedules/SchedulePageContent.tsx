"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, Plus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { ErrorState } from "@/components/state/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useScheduleData, useSchedules } from "@/hooks/use-schedules";
import { apiClient } from "@/lib/api";
import { DayOfWeek, Schedule, Semester } from "@/types";
import { GenerateScheduleModal } from "@/components/dashboard/generate-schedule-modal";
import { TimetableGrid } from "@/components/schedules/timetable-grid";
import { MobileTimetable } from "@/components/schedules/mobile-timetable";
import { ScheduleDetailSheet } from "@/components/schedules/schedule-detail-sheet";
import { CreateScheduleModal } from "@/components/schedules/create-schedule-modal";
import { UnscheduledCoursesPanel } from "@/components/schedules/unscheduled-courses-panel";
import { UnscheduledUniversityCoursesPanel } from "@/components/schedules/unscheduled-university-courses-panel";
import {
  ScheduleFilterBar,
  Programme,
} from "@/components/schedules/schedule-filter-bar";
import { ScheduleAgendaView } from "@/components/schedules/schedule-agenda-view";
import { ScheduleExportMenu } from "@/components/schedules/schedule-export-menu";

export default function SchedulePageContent() {
  const searchParams = useSearchParams();
  const { isAdmin, isCollegeAdmin, isHod, isLecturer, user } = useAuth();
  const canMutateSchedules = isAdmin || isCollegeAdmin || isHod;

  const { toast } = useToast();
  const isTeacher = isHod || isLecturer;

  const {
    departments,
    sessions,
    activeSession,
    selectedSessionId,
    setSelectedSessionId,
  } = useScheduleData();

  const [viewMode, setViewMode] = useState<"timetable" | "agenda">("agenda");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [selectedProgramme, setSelectedProgramme] = useState<string>("all");
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [selectedSemester, setSelectedSemester] = useState<string>("FIRST");
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [unscheduledKey, setUnscheduledKey] = useState(0);
  const [myClassesOnly, setMyClassesOnly] = useState(true);
  const myClassesDefaultSet = useRef(false);

  const [programmes] = useState<Programme[]>([]);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null);
  const openForDetailRef = useRef<string | null>(null);
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

  useEffect(() => {
    if (!myClassesDefaultSet.current && user && isTeacher) {
      setMyClassesOnly(true);
      myClassesDefaultSet.current = true;
    }
  }, [user, isTeacher]);

  useEffect(() => {
    if (activeSession && selectedSessionId !== activeSession.id) {
      setSelectedSessionId(activeSession.id);
    }
  }, [activeSession, selectedSessionId, setSelectedSessionId]);

  const handleDepartmentChange = (dept: string) => {
    setSelectedDepartment(dept);
    setSelectedProgramme("all");
    setCurrentPage(1);
  };

  const scheduleLimit = myClassesOnly ? 500 : limit;

  const effectiveLevel = myClassesOnly ? "all" : selectedLevel;

  const {
    schedules,
    loading,
    refetching,
    fetchError,
    totalPages,
    total,
    refetch,
    setFetchError,
  } = useSchedules({
    searchTerm,
    departmentCode: selectedDepartment,
    programme: selectedProgramme,
    level: effectiveLevel,
    day: selectedDay,
    semester: selectedSemester,
    sessionId: selectedSessionId,
    page: currentPage,
    limit: scheduleLimit,
  });

  usePageLoadReporter(loading);

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
      openForDetailRef.current = s.id;
      setDetailSchedule(s);
      try {
        const res = await apiClient.getScheduleById(s.id);
        if (openForDetailRef.current !== s.id) return;
        if (res.success && res.data) setDetailSchedule(res.data as Schedule);
      } catch {
        if (openForDetailRef.current === s.id)
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
        openForDetailRef.current = null;
        setDetailSchedule(null);
        refetch();
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
    refetch();
    setUnscheduledKey((k) => k + 1);
  }, [refetch]);

  const baseFilteredSchedules = schedules.filter(
    (s) =>
      s.course?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.course?.code.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredSchedules = myClassesOnly
    ? baseFilteredSchedules.filter((s) => s.course?.lecturer?.id === user?.id)
    : baseFilteredSchedules;

  const handleReset = () => {
    setSearchTerm("");
    setSelectedDepartment("all");
    setSelectedProgramme("all");
    setSelectedLevel("all");
    setSelectedDay("all");
    setSelectedSemester("all");
    setSelectedSessionId("");
    setMyClassesOnly(false);
    setCurrentPage(1);
  };

  const filterCount = [
    selectedSessionId && selectedSessionId !== activeSession?.id,
    selectedSemester !== "all",
    selectedDepartment !== "all",
    selectedProgramme !== "all",
    selectedLevel !== "all",
    viewMode === "timetable" && selectedDay !== "all",
    myClassesOnly,
  ].filter(Boolean).length;

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
              <span className="text-slate-300">&bull;</span>
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
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                viewMode === "agenda"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Agenda
            </button>
            <button
              onClick={() => setViewMode("timetable")}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
                viewMode === "timetable"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
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
        <>
          <UnscheduledUniversityCoursesPanel
            refreshKey={unscheduledKey}
            onScheduleCourse={(courseCode) => {
              setEditSchedule(null);
              setCreateModalPrefill({ courseCode });
              setCreateModalOpen(true);
            }}
          />
          <UnscheduledCoursesPanel
            key={unscheduledKey}
            onAddSchedule={(courseCode) => {
              setEditSchedule(null);
              setCreateModalPrefill({ courseCode });
              setCreateModalOpen(true);
            }}
          />
        </>
      )}

      <ScheduleFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedSessionId={selectedSessionId}
        onSessionChange={setSelectedSessionId}
        selectedSemester={selectedSemester}
        onSemesterChange={setSelectedSemester}
        selectedDepartment={selectedDepartment}
        onDepartmentChange={handleDepartmentChange}
        selectedProgramme={selectedProgramme}
        onProgrammeChange={(v) => {
          setSelectedProgramme(v);
          setCurrentPage(1);
        }}
        selectedLevel={selectedLevel}
        onLevelChange={setSelectedLevel}
        sessions={sessions}
        departments={departments}
        programmes={programmes}
        filterCount={filterCount}
        onClear={handleReset}
        myClassesOnly={myClassesOnly}
        onMyClassesOnlyChange={setMyClassesOnly}
        showMyClassesFilter={isTeacher && !!user?.id}
      />

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
          openForDetailRef.current = null;
          setDetailSchedule(null);
        }}
        onEdit={(s) => {
          openForDetailRef.current = null;
          setDetailSchedule(null);
          setEditSchedule(s);
          setCreateModalOpen(true);
        }}
        onDelete={(s) => setDeleteSchedule(s)}
        onFixedToggled={(updated) => {
          setDetailSchedule(updated);
          refetch();
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

      {fetchError ? (
        <ErrorState
          entity="schedules"
          onRetry={() => {
            setFetchError(null);
            refetch();
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
              Showing {filteredSchedules.length} class
              {filteredSchedules.length !== 1 ? "es" : ""}
              {myClassesOnly ? " you teach" : ""}
            </p>
            {filteredSchedules.length > 0 && (
              <ScheduleExportMenu
                filters={{
                  departmentCode: selectedDepartment,
                  programme:
                    selectedProgramme !== "all" ? selectedProgramme : undefined,
                  level: effectiveLevel,
                  day: selectedDay,
                  searchTerm,
                  sessionId: selectedSessionId || activeSession?.id,
                  semester:
                    selectedSemester !== "all" ? selectedSemester : undefined,
                  lecturerId: myClassesOnly && user?.id ? user.id : undefined,
                }}
                fallbackSchedules={filteredSchedules}
              />
            )}
          </div>

          {filteredSchedules.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center">
              <Clock className="h-16 w-16 text-slate-200 mb-6" />
              <h3 className="text-lg font-semibold text-slate-900">
                {myClassesOnly ? "No Classes Found" : "No schedules to display"}
              </h3>
              <p className="text-slate-500 mt-2 max-w-md">
                {myClassesOnly
                  ? "You have no classes scheduled. When courses are assigned and schedules are generated, they will appear here."
                  : "No classes scheduled for the selected parameters. Adjust your filters or generate a new timetable."}
              </p>
            </div>
          ) : viewMode === "agenda" ? (
            <ScheduleAgendaView
              schedules={filteredSchedules}
              onScheduleClick={openScheduleDetail}
            />
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

          {!myClassesOnly && total > 0 && (
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
