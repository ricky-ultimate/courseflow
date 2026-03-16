"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveSessionInvalidateCount } from "@/contexts/ActiveSessionContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Calendar,
  MessageCircle,
  Building2,
  Clock,
  GraduationCap,
  CalendarDays,
  RefreshCw,
  Lock,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import {
  DepartmentStatistics,
  CourseStatistics,
  ScheduleStatistics,
  AcademicSession,
  LecturerDashboard,
  Department,
  Schedule,
  Exam,
  Course,
  VenueType,
  Level,
  DayOfWeek,
} from "@/types";
import { useToast } from "@/hooks/use-toast";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GenerateScheduleModal } from "@/components/dashboard/generate-schedule-modal";
import { ErrorState } from "@/components/state/error-state";

const VENUE_LABELS: Record<string, string> = {
  [VenueType.UNIVERSITY_ICT_CENTER]: "University ICT Centre",
  [VenueType.ICT_LAB_1]: "ICT Lab 1",
  [VenueType.ICT_LAB_2]: "ICT Lab 2",
  [VenueType.COMPUTER_LAB]: "Computer Lab",
  [VenueType.LECTURE_HALL_1]: "Lecture Hall 1",
  [VenueType.LECTURE_HALL_2]: "Lecture Hall 2",
  [VenueType.LECTURE_HALL_3]: "Lecture Hall 3",
  [VenueType.AUDITORIUM_A]: "Auditorium A",
  [VenueType.AUDITORIUM_B]: "Auditorium B",
  [VenueType.SEMINAR_ROOM_A]: "Seminar Room A",
  [VenueType.SEMINAR_ROOM_B]: "Seminar Room B",
  [VenueType.ROOM_101]: "Room 101",
  [VenueType.ROOM_102]: "Room 102",
  [VenueType.ROOM_201]: "Room 201",
  [VenueType.ROOM_202]: "Room 202",
  [VenueType.ROOM_301]: "Room 301",
  [VenueType.ROOM_302]: "Room 302",
  [VenueType.SCIENCE_LAB_1]: "Science Lab 1",
  [VenueType.SCIENCE_LAB_2]: "Science Lab 2",
};

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

const WEEKDAYS = [DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY] as const;
const JS_DAY_TO_DOW: DayOfWeek[] = [
  DayOfWeek.SUNDAY, DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY, DayOfWeek.FRIDAY, DayOfWeek.SATURDAY,
];

function getNextClassToday(schedules: Schedule[]): string {
  const now = new Date();
  const today = JS_DAY_TO_DOW[now.getDay()];
  const nowStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const todaySchedules = schedules
    .filter((s) => s.dayOfWeek === today && s.startTime)
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  const next = todaySchedules.find((s) => (s.startTime || "") > nowStr);
  if (next) {
    const code = next.course?.code ?? next.courseCode;
    return `${next.startTime} — ${code}`;
  }
  return "—";
}
const DAY_LABELS: Record<DayOfWeek, string> = {
  [DayOfWeek.MONDAY]: "MON",
  [DayOfWeek.TUESDAY]: "TUE",
  [DayOfWeek.WEDNESDAY]: "WED",
  [DayOfWeek.THURSDAY]: "THU",
  [DayOfWeek.FRIDAY]: "FRI",
  [DayOfWeek.SATURDAY]: "SAT",
  [DayOfWeek.SUNDAY]: "SUN",
};

const DEPT_COLOR_CLASSES = [
  "bg-blue-100 border-l-4 border-blue-400",
  "bg-violet-100 border-l-4 border-violet-400",
  "bg-emerald-100 border-l-4 border-emerald-400",
  "bg-orange-100 border-l-4 border-orange-400",
  "bg-pink-100 border-l-4 border-pink-400",
  "bg-sky-100 border-l-4 border-sky-400",
  "bg-amber-100 border-l-4 border-amber-400",
  "bg-teal-100 border-l-4 border-teal-400",
];

function MobileTimetable({ schedules }: { schedules: Schedule[] }) {
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(DayOfWeek.MONDAY);
  const daySchedules = schedules.filter((s) => s.dayOfWeek === selectedDay).sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));
  const getDeptColor = (code: string) => DEPT_COLOR_CLASSES[Math.abs(code.split("").reduce((a, c) => a + c.charCodeAt(0), 0)) % DEPT_COLOR_CLASSES.length];

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto py-2 -mx-1">
        {WEEKDAYS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setSelectedDay(d)}
            className={`min-w-[52px] min-h-[44px] h-11 rounded-full px-3 text-sm font-medium shrink-0 touch-manipulation ${selectedDay === d ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700"}`}
          >
            {DAY_LABELS[d]}
          </button>
        ))}
      </div>
      <div className="mt-4 space-y-3">
        {daySchedules.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No classes this day</p>
        ) : (
          daySchedules.map((s) => (
            <div key={s.id} className={`rounded-lg p-3 min-h-[72px] ${getDeptColor(s.course?.departmentCode ?? "X")}`}>
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono text-gray-600">{s.course?.departmentCode ?? "—"}</span>
                {s.isManualOverride && <span className="text-amber-600 text-xs">●</span>}
              </div>
              <p className="font-mono text-sm font-semibold text-gray-900">{s.course?.code ?? s.courseCode}</p>
              <p className="text-xs text-gray-600 truncate">{s.course?.name ?? ""}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.startTime} – {s.endTime}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
  iconBg,
}: {
  icon: React.ComponentType<{ className?: string }>;
  value: string | number;
  label: string;
  iconBg: string;
}) {
  return (
    <Card className="rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-full ${iconBg} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="text-[28px] font-bold leading-tight">{value}</div>
      <p className="text-[13px] text-gray-500 mt-1">{label}</p>
    </Card>
  );
}

export default function DashboardPage() {
  const { user, isAdmin, isLecturer, isHod, isStudent } = useAuth();
  const { toast } = useToast();
  const activeSessionInvalidateCount = useActiveSessionInvalidateCount();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  usePageLoadReporter(loading);

  // ADMIN
  const [deptStats, setDeptStats] = useState<DepartmentStatistics | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStatistics | null>(null);
  const [scheduleStats, setScheduleStats] = useState<ScheduleStatistics | null>(null);
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  // HOD / LECTURER
  const [lecturerDashboard, setLecturerDashboard] = useState<LecturerDashboard | null>(null);
  const [lecturerCourses, setLecturerCourses] = useState<Course[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [lecturerSchedules, setLecturerSchedules] = useState<Schedule[]>([]);
  const [togglingLock, setTogglingLock] = useState(false);
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);

  // STUDENT
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  // Modals
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  const fetchAdminData = useCallback(async () => {
    const [deptRes, courseRes, schedRes, sessionRes, pendingRes] = await Promise.all([
      apiClient.getDepartmentStatistics(),
      apiClient.getCourseStatistics(),
      apiClient.getScheduleStatistics(),
      apiClient.getActiveAcademicSession(),
      apiClient.getPendingComplaints(),
    ]);
    if (deptRes.success && deptRes.data) setDeptStats(deptRes.data as DepartmentStatistics);
    if (courseRes.success && courseRes.data) setCourseStats(courseRes.data as CourseStatistics);
    if (schedRes.success && schedRes.data) setScheduleStats(schedRes.data as ScheduleStatistics);
    if (sessionRes.success && sessionRes.data) setActiveSession(sessionRes.data as AcademicSession);
    if (pendingRes.success && Array.isArray(pendingRes.data)) setPendingCount((pendingRes.data as unknown[]).length);
    else if (pendingRes.success && (pendingRes.data as any)?.data?.length) setPendingCount((pendingRes.data as any).data.length);
  }, []);

  const fetchHodData = useCallback(async () => {
    const [dashRes, schedRes, coursesRes, deptRes] = await Promise.all([
      apiClient.getLecturerDashboard(),
      apiClient.getLecturerSchedule(),
      apiClient.getLecturerCourses(),
      user?.departmentCode ? apiClient.getDepartmentByCode(user.departmentCode) : Promise.resolve({ success: false, data: null }),
    ]);
    if (dashRes.success && dashRes.data) setLecturerDashboard(dashRes.data as LecturerDashboard);
    if (deptRes.success && deptRes.data) setDepartment(deptRes.data as Department);
    const sched = getItemsFromResponse<Schedule>(schedRes);
    setLecturerSchedules(sched?.items ?? []);
    const courses = getItemsFromResponse<Course>(coursesRes);
    setLecturerCourses(courses?.items ?? []);
  }, [user?.departmentCode]);

  const fetchStudentData = useCallback(async () => {
    const [schedRes, examRes] = await Promise.all([
      apiClient.getSchedules(),
      apiClient.getExams(),
    ]);
    const sched = getItemsFromResponse<Schedule>(schedRes);
    const exam = getItemsFromResponse<Exam>(examRes);
    setSchedules(sched?.items ?? []);
    setExams(exam?.items ?? []);
  }, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isAdmin) await fetchAdminData();
        else if (isHod || isLecturer) await fetchHodData();
        else if (isStudent) await fetchStudentData();
      } catch (e) {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [isAdmin, isHod, isLecturer, isStudent, retryTrigger, activeSessionInvalidateCount, fetchAdminData, fetchHodData, fetchStudentData]);

  const handleToggleLock = async (): Promise<boolean> => {
    if (!department || !user?.departmentCode) return false;
    const prevLocked = department.isScheduleLocked;
    setDepartment((d) => (d ? { ...d, isScheduleLocked: !d.isScheduleLocked } : null));
    setTogglingLock(true);
    try {
      const fn = prevLocked ? apiClient.unlockDepartmentSchedule : apiClient.lockDepartmentSchedule;
      const res = await fn(department.code);
      if (res.success) {
        toast({ title: `Schedule ${prevLocked ? "unlocked" : "locked"} for ${department.name}.` });
        try {
          const deptRes = await apiClient.getDepartmentByCode(department.code);
          if (deptRes.success && deptRes.data) setDepartment(deptRes.data as Department);
        } catch {
          // Refetch failed but mutation succeeded — keep optimistic state
        }
        return true;
      }
      setDepartment((d) => (d ? { ...d, isScheduleLocked: prevLocked } : null));
      toast({ title: (res as any).error, variant: "destructive" });
      return false;
    } catch {
      setDepartment((d) => (d ? { ...d, isScheduleLocked: prevLocked } : null));
      toast({ title: "Failed to update", variant: "destructive" });
      return false;
    } finally {
      setTogglingLock(false);
    }
  };

  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] || "there";

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{greeting}, {firstName}</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-xl p-5 animate-pulse">
              <div className="w-10 h-10 rounded-lg bg-gray-200 mb-3" />
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mt-2" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="dashboard" onRetry={() => { setError(null); setRetryTrigger(t => t + 1); }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">{greeting}, {user?.name || firstName}</p>
      </div>

      {/* ADMIN Dashboard */}
      {isAdmin && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard icon={Building2} value={deptStats?.totalDepartments ?? 0} label="Total Departments" iconBg="bg-indigo-500" />
            <StatCard icon={BookOpen} value={courseStats?.totalCourses ?? 0} label="Total Courses" iconBg="bg-violet-500" />
            <StatCard icon={Clock} value={scheduleStats?.totalSchedules ?? 0} label="Total Schedules" iconBg="bg-sky-500" />
            <StatCard icon={CalendarDays} value={activeSession?.name ?? "None"} label="Active Session" iconBg="bg-emerald-500" />
          </div>
          {/* Charts row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Courses by Level</h3>
              <div className="space-y-3">
                {([Level.LEVEL_100, Level.LEVEL_200, Level.LEVEL_300, Level.LEVEL_400, Level.LEVEL_500] as const).map((l) => {
                  const count = courseStats?.coursesByLevel?.[l] ?? 0;
                  const max = Math.max(1, ...Object.values(courseStats?.coursesByLevel ?? {}));
                  const pct = max ? (count / max) * 100 : 0;
                  const labels: Record<Level, string> = {
                    [Level.LEVEL_100]: "100L",
                    [Level.LEVEL_200]: "200L",
                    [Level.LEVEL_300]: "300L",
                    [Level.LEVEL_400]: "400L",
                    [Level.LEVEL_500]: "500L",
                  };
                  return (
                    <div key={l} className="flex items-center gap-3">
                      <span className="w-10 text-sm text-gray-600">{labels[l]}</span>
                      <div className="flex-1 h-6 bg-gray-100 rounded overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-8 text-sm font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
            <Card className="rounded-xl border p-5">
              <h3 className="font-semibold mb-4">Schedules by Day</h3>
              <div className="flex items-end justify-between gap-2 h-28">
                {[DayOfWeek.MONDAY, DayOfWeek.TUESDAY, DayOfWeek.WEDNESDAY, DayOfWeek.THURSDAY, DayOfWeek.FRIDAY].map((d) => {
                  const count = scheduleStats?.schedulesByDay?.[d] ?? 0;
                  const vals = Object.values(scheduleStats?.schedulesByDay ?? {}).filter((v): v is number => typeof v === "number");
                  const max = Math.max(1, ...vals);
                  const heightPct = max ? (count / max) * 100 : 0;
                  const labels: Record<DayOfWeek, string> = {
                    [DayOfWeek.MONDAY]: "Mon",
                    [DayOfWeek.TUESDAY]: "Tue",
                    [DayOfWeek.WEDNESDAY]: "Wed",
                    [DayOfWeek.THURSDAY]: "Thu",
                    [DayOfWeek.FRIDAY]: "Fri",
                    [DayOfWeek.SATURDAY]: "Sat",
                    [DayOfWeek.SUNDAY]: "Sun",
                  };
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center justify-end gap-1">
                      <span className="text-xs text-gray-500">{count}</span>
                      <div className="w-full bg-gray-100 rounded-t overflow-hidden" style={{ height: 80 }}>
                        <div className="w-full bg-violet-500 rounded-t transition-all" style={{ height: `${heightPct}%`, minHeight: count ? 4 : 0 }} />
                      </div>
                      <span className="text-xs font-medium text-gray-600">{labels[d]}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="rounded-xl border border-gray-200 p-5">
              <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center mb-3">
                <RefreshCw className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-2">Generate Schedules</h3>
              <p className="text-[13px] text-gray-500 mb-4">Auto-generate timetables for the active session</p>
              <Button onClick={() => setGenerateModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white">Generate</Button>
            </Card>
            <Card className="rounded-xl border border-gray-200 p-5">
              <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center mb-3">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-2">Pending Complaints</h3>
              <p className="text-[13px] text-gray-500 mb-2">Complaints awaiting your response</p>
              <p className="text-4xl font-bold text-amber-600 mb-4">{pendingCount}</p>
              <Button asChild variant="outline"><Link href="/complaints">View Complaints</Link></Button>
            </Card>
            <Card className="rounded-xl border border-gray-200 p-5">
              <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center mb-3">
                <CalendarDays className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-base font-semibold mb-2">Academic Session</h3>
              <p className="text-[13px] text-gray-500 mb-4">{activeSession?.name ?? "None"}</p>
              <Button asChild variant="outline"><Link href="/sessions">Manage Sessions</Link></Button>
            </Card>
          </div>
          <GenerateScheduleModal open={generateModalOpen} onOpenChange={setGenerateModalOpen} onSuccess={fetchAdminData} />
        </>
      )}

      {/* HOD Dashboard */}
      {(isHod || isLecturer) && lecturerDashboard && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard icon={BookOpen} value={lecturerDashboard.totalCourses} label="My Courses" iconBg="bg-indigo-500" />
            <StatCard icon={Clock} value={lecturerDashboard.totalSchedules} label="Scheduled Classes" iconBg="bg-violet-500" />
            <StatCard icon={Calendar} value={lecturerDashboard.upcomingClasses} label="Upcoming Classes" iconBg="bg-sky-500" />
            {isHod && department && (
              <Card
                className="rounded-xl p-5 cursor-pointer flex flex-col justify-center touch-manipulation"
                onClick={() => setLockConfirmOpen(true)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${department.isScheduleLocked ? "bg-amber-500" : "bg-emerald-500"}`}>
                  {department.isScheduleLocked ? <Lock className="h-5 w-5 text-white" /> : <Unlock className="h-5 w-5 text-white" />}
                </div>
                <div className="text-2xl font-bold">{department.isScheduleLocked ? "Locked" : "Unlocked"}</div>
                <p className="text-[13px] text-gray-500 mt-1">Department Schedule</p>
              </Card>
            )}
          </div>
          <Card className="rounded-xl p-5">
            <h3 className="font-semibold mb-4">My Courses</h3>
            {lecturerCourses.length === 0 ? (
              <p className="text-sm text-gray-500">No courses assigned.</p>
            ) : (
              <ul className="space-y-2">
                {lecturerCourses.slice(0, 8).map((c) => (
                  <li key={c.id} className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {c.code}
                    </span>
                    <span>{c.name}</span>
                  </li>
                ))}
                {lecturerCourses.length > 8 && (
                  <li className="text-sm text-gray-500">+{lecturerCourses.length - 8} more</li>
                )}
              </ul>
            )}
            <Button asChild variant="outline" className="mt-4"><Link href="/courses">View All Courses</Link></Button>
          </Card>
          <Card className="rounded-xl p-5">
            <h3 className="font-semibold mb-2">My Schedule This Week</h3>
            <MobileTimetable schedules={lecturerSchedules} />
            <Button asChild variant="outline" className="mt-4"><Link href="/schedules">View Full Schedule</Link></Button>
          </Card>
          <ConfirmDialog
            open={lockConfirmOpen}
            onOpenChange={setLockConfirmOpen}
            title={department?.isScheduleLocked ? "Unlock Schedule?" : "Lock Schedule?"}
            description={
              department?.isScheduleLocked
                ? "This will unlock the department schedule. Lecturers and admins will be able to modify schedules again."
                : `This will lock the schedule for ${department?.name ?? "this department"}. No further changes can be made until it is unlocked.`
            }
            icon={department?.isScheduleLocked ? Unlock : Lock}
            iconClassName={department?.isScheduleLocked ? "bg-green-500 text-white" : "bg-amber-500 text-white"}
            confirmLabel={department?.isScheduleLocked ? "Unlock" : "Lock"}
            confirmClassName={department?.isScheduleLocked ? "bg-green-600 hover:bg-green-700 text-white" : "bg-amber-600 hover:bg-amber-700 text-white"}
            onConfirm={handleToggleLock}
            loading={togglingLock}
          />
        </>
      )}

      {/* STUDENT Dashboard */}
      {isStudent && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <StatCard icon={BookOpen} value={schedules.length} label="Total courses this semester" iconBg="bg-indigo-500" />
            <StatCard icon={Calendar} value={exams.length} label="Upcoming exams" iconBg="bg-violet-500" />
            <StatCard icon={Clock} value={(() => {
              const today = new Date().toISOString().slice(0, 10);
              const sorted = [...exams].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date));
              return sorted[0] ? new Date(sorted[0].date).toLocaleDateString() : "—";
            })()} label="Next exam date" iconBg="bg-sky-500" />
            <StatCard icon={GraduationCap} value={getNextClassToday(schedules)} label="Next class today" iconBg="bg-emerald-500" />
          </div>
          <Card className="rounded-xl p-5">
            <h3 className="font-semibold mb-2">This Week&apos;s Schedule</h3>
            <MobileTimetable schedules={schedules} />
            <Button asChild variant="outline" className="mt-4"><Link href="/schedules">View Schedules</Link></Button>
          </Card>
          <Card className="rounded-xl p-5">
            <h3 className="font-semibold mb-4">Upcoming Exams</h3>
            <div className="space-y-2">
              {[...exams]
                .filter((e) => e.date >= new Date().toISOString().slice(0, 10))
                .sort((a, b) => a.date.localeCompare(b.date))
                .slice(0, 5)
                .map((e) => (
                <div key={e.id} className="flex justify-between text-sm gap-2">
                  <span className="font-medium">{new Date(e.date).toLocaleDateString()}</span>
                  <span>{e.courseCode}</span>
                  <span className="text-gray-500 truncate">{VENUE_LABELS[e.venue] ?? e.venue}</span>
                </div>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-4"><Link href="/exams">View All Exams</Link></Button>
          </Card>
        </>
      )}

      {/* Fallback for roles without specific dashboard */}
      {!isAdmin && !isHod && !isLecturer && !isStudent && (
        <Card className="rounded-xl p-8 text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="font-semibold">Welcome</h3>
          <p className="text-sm text-gray-500 mt-2">Use the sidebar to navigate.</p>
        </Card>
      )}
    </div>
  );
}
