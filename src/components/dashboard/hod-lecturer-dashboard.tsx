"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Clock, Lock, Unlock, Users } from "lucide-react";
import { Course, Department, LecturerDashboard, Schedule } from "@/types";
import { DashboardMobileTimetable } from "./mobile-timetable";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface HodLecturerDashboardProps {
  lecturerDashboard: LecturerDashboard;
  lecturerCourses: Course[];
  lecturerSchedules: Schedule[];
  department: Department | null;
  isHod: boolean;
  onToggleLock: () => Promise<boolean>;
  togglingLock: boolean;
}

export function HodLecturerDashboard({
  lecturerDashboard,
  lecturerCourses,
  lecturerSchedules,
  department,
  isHod,
  onToggleLock,
  togglingLock,
}: HodLecturerDashboardProps) {
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);

  const totalCourses = lecturerDashboard.totalCourses;
  const totalSchedules = lecturerDashboard.totalSchedules;
  const upcomingClasses = lecturerDashboard.upcomingClasses;
  const scheduledPercentage =
    totalCourses > 0 ? (totalSchedules / totalCourses) * 100 : 0;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6 relative">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
              <BookOpen className="h-6 w-6 text-indigo-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalCourses}</p>
            <p className="text-sm text-gray-500 mt-1">Assigned Courses</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6 relative">
            <div className="w-12 h-12 rounded-full bg-violet-100 flex items-center justify-center mb-4">
              <Calendar className="h-6 w-6 text-violet-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalSchedules}</p>
            <p className="text-sm text-gray-500 mt-1">Scheduled Classes</p>
            <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, scheduledPercentage)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {Math.round(scheduledPercentage)}% of courses scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-0 shadow-md overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full -mr-16 -mt-16" />
          <CardContent className="p-6 relative">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {upcomingClasses}
            </p>
            <p className="text-sm text-gray-500 mt-1">Upcoming Classes</p>
            <p className="text-xs text-emerald-600 mt-2 font-medium">
              This week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-md overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Recent Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lecturerCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  No courses assigned yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lecturerCourses.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {c.code}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{c.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-gray-500">
                        {c.level.replace("LEVEL_", "")}L
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {c.credits} credits
                      </p>
                    </div>
                  </div>
                ))}
                {lecturerCourses.length > 5 && (
                  <p className="text-xs text-gray-400 text-center pt-2">
                    +{lecturerCourses.length - 5} more courses
                  </p>
                )}
              </div>
            )}
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/courses?myCoursesOnly=true">Manage Courses</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-md overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Weekly Schedule Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DashboardMobileTimetable schedules={lecturerSchedules} />
            <Button asChild variant="outline" className="w-full mt-4">
              <Link href="/schedules?myClassesOnly=true">
                View Full Schedule
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {isHod && department && (
        <Card className="rounded-2xl shadow-md overflow-hidden border-l-4 border-amber-500">
          <CardContent className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-amber-600" />
                  <h3 className="text-base font-semibold text-gray-900">
                    Department: {department.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-500">
                  Current schedule status:{" "}
                  <span
                    className={`font-semibold ${department.isScheduleLocked ? "text-amber-600" : "text-emerald-600"}`}
                  >
                    {department.isScheduleLocked ? "Locked" : "Unlocked"}
                  </span>
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {department.isScheduleLocked
                    ? "Schedule modifications are locked. Generate schedules is disabled."
                    : "Department schedule is unlocked. Changes can be made."}
                </p>
              </div>
              <Button
                variant={department.isScheduleLocked ? "outline" : "default"}
                className={
                  department.isScheduleLocked
                    ? "border-amber-500 text-amber-600 hover:bg-amber-50"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }
                onClick={() => setLockConfirmOpen(true)}
                disabled={togglingLock}
              >
                {department.isScheduleLocked ? (
                  <Unlock className="h-4 w-4 mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {department.isScheduleLocked
                  ? "Unlock Schedule"
                  : "Lock Schedule"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isHod && department && (
        <ConfirmDialog
          open={lockConfirmOpen}
          onOpenChange={setLockConfirmOpen}
          title={
            department.isScheduleLocked ? "Unlock Schedule?" : "Lock Schedule?"
          }
          description={
            department.isScheduleLocked
              ? "This will unlock the department schedule. Lecturers and admins will be able to modify schedules again, and auto-generation will include this department."
              : `Locking the schedule for ${department.name} will prevent any further auto-generation changes. Manual overrides can still be made by administrators.`
          }
          icon={department.isScheduleLocked ? Unlock : Lock}
          iconClassName={
            department.isScheduleLocked
              ? "bg-emerald-500 text-white"
              : "bg-amber-500 text-white"
          }
          confirmLabel={department.isScheduleLocked ? "Unlock" : "Lock"}
          confirmClassName={
            department.isScheduleLocked
              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
              : "bg-amber-600 hover:bg-amber-700 text-white"
          }
          onConfirm={onToggleLock}
          loading={togglingLock}
        />
      )}
    </div>
  );
}
