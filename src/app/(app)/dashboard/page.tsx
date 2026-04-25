"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { useDashboard } from "@/hooks/use-dashboard";
import { apiClient } from "@/lib/api";
import { College, Department } from "@/types";
import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";
import { ErrorState } from "@/components/state/error-state";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { CollegeAdminDashboard } from "@/components/dashboard/college-admin-dashboard";
import { HodLecturerDashboard } from "@/components/dashboard/hod-lecturer-dashboard";
import { StudentDashboard } from "@/components/dashboard/student-dashboard";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 18) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const { user, isAdmin, isCollegeAdmin, isLecturer, isHod, isStudent } =
    useAuth();
  const { toast } = useToast();
  const [togglingLock, setTogglingLock] = useState(false);

  const {
    loading,
    error,
    retry,
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
    refetchAdmin,
  } = useDashboard();

  usePageLoadReporter(loading);

  const greeting = getGreeting();
  const firstName = user?.name?.split(" ")[0] || "there";

  const handleToggleLock = async (): Promise<boolean> => {
    if (!department || !user?.departmentCode) return false;
    const prevLocked = department.isScheduleLocked;
    setDepartment((d: Department | null) =>
      d ? { ...d, isScheduleLocked: !d.isScheduleLocked } : null,
    );
    setTogglingLock(true);
    try {
      const fn = prevLocked
        ? apiClient.unlockDepartmentSchedule
        : apiClient.lockDepartmentSchedule;
      const res = await fn(department.code);
      if (res.success) {
        toast({
          title: `Schedule ${prevLocked ? "unlocked" : "locked"} for ${department.name}.`,
        });
        try {
          const deptRes = await apiClient.getDepartmentByCode(department.code);
          if (deptRes.success && deptRes.data)
            setDepartment(deptRes.data as Department);
        } catch {}
        return true;
      }
      setDepartment((d: Department | null) =>
        d ? { ...d, isScheduleLocked: prevLocked } : null,
      );
      toast({ title: (res as any).error, variant: "destructive" });
      return false;
    } catch {
      setDepartment((d: Department | null) =>
        d ? { ...d, isScheduleLocked: prevLocked } : null,
      );
      toast({ title: "Failed to update", variant: "destructive" });
      return false;
    } finally {
      setTogglingLock(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {greeting}, {firstName}
        </p>
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
          <ErrorState entity="dashboard" onRetry={retry} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          {greeting}, {user?.name || firstName}
        </p>
      </div>

      {isAdmin && (
        <AdminDashboard
          deptStats={deptStats}
          courseStats={courseStats}
          scheduleStats={scheduleStats}
          activeSession={activeSession}
          pendingCount={pendingCount}
          onRefresh={refetchAdmin}
        />
      )}

      {isCollegeAdmin && (
        <CollegeAdminDashboard
          deptStats={deptStats}
          courseStats={courseStats}
          scheduleStats={scheduleStats}
          activeSession={activeSession}
          pendingCount={pendingCount}
          collegeCode={(user?.collegeCode as College) ?? null}
          onRefresh={refetchAdmin}
        />
      )}

      {(isHod || isLecturer) && lecturerDashboard && (
        <HodLecturerDashboard
          lecturerDashboard={lecturerDashboard}
          lecturerCourses={lecturerCourses}
          lecturerSchedules={lecturerSchedules}
          department={department}
          isHod={!!isHod}
          onToggleLock={handleToggleLock}
          togglingLock={togglingLock}
        />
      )}

      {isStudent && <StudentDashboard schedules={schedules} exams={exams} />}

      {!isAdmin && !isCollegeAdmin && !isHod && !isLecturer && !isStudent && (
        <Card className="rounded-xl p-8 text-center">
          <GraduationCap className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="font-semibold">Welcome</h3>
          <p className="text-sm text-gray-500 mt-2">
            Use the sidebar to navigate.
          </p>
        </Card>
      )}
    </div>
  );
}
