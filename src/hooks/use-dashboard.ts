"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useActiveSessionInvalidateCount } from "@/contexts/ActiveSessionContext";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import {
  AcademicSession,
  Course,
  Department,
  DayOfWeek,
  DepartmentStatistics,
  CourseStatistics,
  ScheduleStatistics,
  LecturerDashboard,
  Schedule,
  Exam,
} from "@/types";

export function useDashboard() {
  const { isAdmin, isCollegeAdmin, isHod, isLecturer, isStudent, user } =
    useAuth();
  const activeSessionInvalidateCount = useActiveSessionInvalidateCount();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  const [deptStats, setDeptStats] = useState<DepartmentStatistics | null>(null);
  const [courseStats, setCourseStats] = useState<CourseStatistics | null>(null);
  const [scheduleStats, setScheduleStats] = useState<ScheduleStatistics | null>(
    null,
  );
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(
    null,
  );
  const [pendingCount, setPendingCount] = useState(0);

  const [lecturerDashboard, setLecturerDashboard] =
    useState<LecturerDashboard | null>(null);
  const [lecturerCourses, setLecturerCourses] = useState<Course[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [lecturerSchedules, setLecturerSchedules] = useState<Schedule[]>([]);

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);

  const fetchAdminData = useCallback(async () => {
    const [deptRes, courseRes, schedRes, sessionRes, pendingRes] =
      await Promise.all([
        apiClient.getDepartmentStatistics(),
        apiClient.getCourseStatistics(),
        apiClient.getScheduleStatistics(),
        apiClient.getActiveAcademicSession(),
        apiClient.getPendingComplaints(),
      ]);
    if (deptRes.success && deptRes.data)
      setDeptStats(deptRes.data as DepartmentStatistics);
    if (courseRes.success && courseRes.data)
      setCourseStats(courseRes.data as CourseStatistics);
    if (schedRes.success && schedRes.data)
      setScheduleStats(schedRes.data as ScheduleStatistics);
    if (sessionRes.success && sessionRes.data)
      setActiveSession(sessionRes.data as AcademicSession);
    if (pendingRes.success && Array.isArray(pendingRes.data))
      setPendingCount((pendingRes.data as unknown[]).length);
    else if (pendingRes.success && (pendingRes.data as any)?.data?.length)
      setPendingCount((pendingRes.data as any).data.length);
  }, []);

  const fetchCollegeAdminData = useCallback(async () => {
    const [deptRes, courseRes, schedRes, sessionRes, pendingRes] =
      await Promise.all([
        apiClient.getDepartmentStatistics(),
        apiClient.getCourseStatistics(),
        apiClient.getScheduleStatistics(),
        apiClient.getActiveAcademicSession(),
        apiClient.getPendingComplaints(),
      ]);
    if (deptRes.success && deptRes.data)
      setDeptStats(deptRes.data as DepartmentStatistics);
    if (courseRes.success && courseRes.data)
      setCourseStats(courseRes.data as CourseStatistics);
    if (schedRes.success && schedRes.data)
      setScheduleStats(schedRes.data as ScheduleStatistics);
    if (sessionRes.success && sessionRes.data)
      setActiveSession(sessionRes.data as AcademicSession);
    if (pendingRes.success && Array.isArray(pendingRes.data))
      setPendingCount((pendingRes.data as unknown[]).length);
    else if (pendingRes.success && (pendingRes.data as any)?.data?.length)
      setPendingCount((pendingRes.data as any).data.length);
  }, []);

  const fetchHodData = useCallback(async () => {
    const [dashRes, schedRes, coursesRes, deptRes] = await Promise.all([
      apiClient.getLecturerDashboard(),
      apiClient.getLecturerSchedule(),
      apiClient.getLecturerCourses(),
      user?.departmentCode
        ? apiClient.getDepartmentByCode(user.departmentCode)
        : Promise.resolve({ success: false, data: null }),
    ]);

    if (dashRes.success && dashRes.data)
      setLecturerDashboard(dashRes.data as LecturerDashboard);

    if (deptRes.success && deptRes.data)
      setDepartment(deptRes.data as Department);

    if (schedRes.success && schedRes.data) {
      const schedData = schedRes.data as {
        schedulesByDay?: Partial<Record<DayOfWeek, Schedule[]>>;
      };
      setLecturerSchedules(
        (Object.values(schedData.schedulesByDay ?? {}) as Schedule[][]).flat(),
      );
    }

    if (coursesRes.success && coursesRes.data) {
      const courseData = coursesRes.data as { courses?: Course[] };
      setLecturerCourses(
        Array.isArray(courseData.courses) ? courseData.courses : [],
      );
    }
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
        else if (isCollegeAdmin) await fetchCollegeAdminData();
        else if (isHod || isLecturer) await fetchHodData();
        else if (isStudent) await fetchStudentData();
      } catch {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [
    isAdmin,
    isCollegeAdmin,
    isHod,
    isLecturer,
    isStudent,
    retryTrigger,
    activeSessionInvalidateCount,
    fetchAdminData,
    fetchCollegeAdminData,
    fetchHodData,
    fetchStudentData,
  ]);

  return {
    loading,
    error,
    retry: () => setRetryTrigger((t) => t + 1),
    deptStats,
    courseStats,
    scheduleStats,
    activeSession,
    pendingCount,
    lecturerDashboard,
    lecturerCourses,
    department,
    setDepartment,
    lecturerSchedules,
    schedules,
    exams,
    refetchAdmin: isAdmin ? fetchAdminData : fetchCollegeAdminData,
  };
}
