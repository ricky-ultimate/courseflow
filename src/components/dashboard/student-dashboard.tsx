"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, Clock, GraduationCap } from "lucide-react";
import { Exam, Schedule } from "@/types";
import { VENUE_LABELS } from "@/lib/constants";
import { StatCard } from "./stat-card";
import {
  DashboardMobileTimetable,
  getNextClassToday,
} from "./mobile-timetable";

interface StudentDashboardProps {
  schedules: Schedule[];
  exams: Exam[];
}

export function StudentDashboard({ schedules, exams }: StudentDashboardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const upcomingExams = [...exams]
    .filter((e) => e.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date));

  const nextExamDate = upcomingExams[0]
    ? new Date(upcomingExams[0].date).toLocaleDateString()
    : "—";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          icon={BookOpen}
          value={schedules.length}
          label="Total courses this semester"
          iconBg="bg-indigo-500"
        />
        <StatCard
          icon={Calendar}
          value={exams.length}
          label="Upcoming exams"
          iconBg="bg-violet-500"
        />
        <StatCard
          icon={Clock}
          value={nextExamDate}
          label="Next exam date"
          iconBg="bg-sky-500"
        />
        <StatCard
          icon={GraduationCap}
          value={getNextClassToday(schedules)}
          label="Next class today"
          iconBg="bg-emerald-500"
        />
      </div>

      <Card className="rounded-xl p-5">
        <h3 className="font-semibold mb-2">This Week&apos;s Schedule</h3>
        <DashboardMobileTimetable schedules={schedules} />
        <Button asChild variant="outline" className="mt-4">
          <Link href="/schedules">View Schedules</Link>
        </Button>
      </Card>

      <Card className="rounded-xl p-5">
        <h3 className="font-semibold mb-4">Upcoming Exams</h3>
        <div className="space-y-2">
          {upcomingExams.slice(0, 5).map((e) => (
            <div key={e.id} className="flex justify-between text-sm gap-2">
              <span className="font-medium">
                {new Date(e.date).toLocaleDateString()}
              </span>
              <span>{e.courseCode}</span>
              <span className="text-gray-500 truncate">
                {VENUE_LABELS[e.venue] ?? e.venue}
              </span>
            </div>
          ))}
        </div>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/exams">View All Exams</Link>
        </Button>
      </Card>
    </>
  );
}
