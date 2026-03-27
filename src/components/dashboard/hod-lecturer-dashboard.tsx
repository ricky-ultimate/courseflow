"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Clock, Lock, Unlock } from "lucide-react";
import { Course, Department, LecturerDashboard, Schedule } from "@/types";
import { StatCard } from "./stat-card";
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

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          icon={BookOpen}
          value={lecturerDashboard.totalCourses}
          label="My Courses"
          iconBg="bg-indigo-500"
        />
        <StatCard
          icon={Clock}
          value={lecturerDashboard.totalSchedules}
          label="Scheduled Classes"
          iconBg="bg-violet-500"
        />
        <StatCard
          icon={Calendar}
          value={lecturerDashboard.upcomingClasses}
          label="Upcoming Classes"
          iconBg="bg-sky-500"
        />
        {isHod && department && (
          <Card
            className="rounded-xl p-5 cursor-pointer flex flex-col justify-center touch-manipulation"
            onClick={() => setLockConfirmOpen(true)}
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center mb-3 ${
                department.isScheduleLocked ? "bg-amber-500" : "bg-emerald-500"
              }`}
            >
              {department.isScheduleLocked ? (
                <Lock className="h-5 w-5 text-white" />
              ) : (
                <Unlock className="h-5 w-5 text-white" />
              )}
            </div>
            <div className="text-2xl font-bold">
              {department.isScheduleLocked ? "Locked" : "Unlocked"}
            </div>
            <p className="text-[13px] text-gray-500 mt-1">
              Department Schedule
            </p>
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
              <li className="text-sm text-gray-500">
                +{lecturerCourses.length - 8} more
              </li>
            )}
          </ul>
        )}
        <Button asChild variant="outline" className="mt-4">
          <Link href="/courses">View All Courses</Link>
        </Button>
      </Card>

      <Card className="rounded-xl p-5">
        <h3 className="font-semibold mb-2">My Schedule This Week</h3>
        <DashboardMobileTimetable schedules={lecturerSchedules} />
        <Button asChild variant="outline" className="mt-4">
          <Link href="/schedules">View Full Schedule</Link>
        </Button>
      </Card>

      {isHod && department && (
        <ConfirmDialog
          open={lockConfirmOpen}
          onOpenChange={setLockConfirmOpen}
          title={
            department.isScheduleLocked ? "Unlock Schedule?" : "Lock Schedule?"
          }
          description={
            department.isScheduleLocked
              ? "This will unlock the department schedule. Lecturers and admins will be able to modify schedules again."
              : `This will lock the schedule for ${department.name}. No further changes can be made until it is unlocked.`
          }
          icon={department.isScheduleLocked ? Unlock : Lock}
          iconClassName={
            department.isScheduleLocked
              ? "bg-green-500 text-white"
              : "bg-amber-500 text-white"
          }
          confirmLabel={department.isScheduleLocked ? "Unlock" : "Lock"}
          confirmClassName={
            department.isScheduleLocked
              ? "bg-green-600 hover:bg-green-700 text-white"
              : "bg-amber-600 hover:bg-amber-700 text-white"
          }
          onConfirm={onToggleLock}
          loading={togglingLock}
        />
      )}
    </>
  );
}
