"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import { Course, AcademicSession, Department, Semester } from "@/types";
import { getInitials } from "@/lib/utils";

interface CourseDetailContentProps {
  course: Course;
  sessions: AcademicSession[];
  departments: Department[];
  canEdit: boolean;
  canSchedule: boolean;
  onClose: () => void;
}

export function CourseDetailContent({
  course,
  sessions,
  departments,
  canEdit,
  canSchedule,
  onClose,
}: CourseDetailContentProps) {
  const router = useRouter();

  const sessionName = course.schedules?.[0]?.sessionId
    ? (sessions.find((s) => s.id === course.schedules![0]!.sessionId)?.name ?? course.schedules[0].sessionId)
    : "—";

  return (
    <div className="pt-12 md:pt-0 space-y-6">
      <div>
        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
          {course.code}
        </span>
        <h2 className="text-xl font-semibold mt-2">{course.name}</h2>
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <p><span className="text-gray-500">Level</span><br />{course.level.replace("LEVEL_", "")}</p>
        <p><span className="text-gray-500">Semester</span><br />{course.semester === Semester.FIRST ? "First" : "Second"}</p>
        <p><span className="text-gray-500">Credits</span><br />{course.credits}</p>
        <p><span className="text-gray-500">Department</span><br />{course.department?.name ?? course.departmentCode}</p>
        <p><span className="text-gray-500">Session</span><br />{sessionName}</p>
      </div>
      <div className="flex gap-2 flex-wrap">
        {course.isActive ? (
          <Badge className="bg-green-100 text-green-700">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        )}
        <Badge variant="secondary">{course.isGeneral ? "General" : "Specific"}</Badge>
        {course.isLocked ? (
          <Badge className="bg-amber-100 text-amber-700">
            <Lock className="h-3 w-3 mr-1" />Locked
          </Badge>
        ) : (
          <Badge variant="outline">Unlocked</Badge>
        )}
      </div>
      <div>
        <h3 className="font-medium mb-2">Overview</h3>
        <p className="text-sm text-gray-600">
          {course.overview ?? <span className="italic text-gray-400">No overview provided.</span>}
        </p>
      </div>
      <div className="rounded-lg border p-4">
        <h3 className="font-medium mb-2">Lecturer</h3>
        {course.lecturer ? (
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                {getInitials(course.lecturer.name)}
              </div>
              <div>
                <p className="font-medium">{course.lecturer.name ?? course.lecturer.email}</p>
                <p className="text-sm text-gray-500">{course.lecturer.email}</p>
                {course.lecturer.departmentCode && (
                  <p className="text-sm text-gray-500">
                    {departments.find((d) => d.code === course.lecturer?.departmentCode)?.name ?? course.lecturer.departmentCode}
                  </p>
                )}
              </div>
            </div>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => { onClose(); router.push(`/courses/${course.code}/edit`); }}>
                Change Lecturer
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 italic">No lecturer assigned</p>
            {canEdit && (
              <Button variant="outline" size="sm" onClick={() => { onClose(); router.push(`/courses/${course.code}/edit`); }}>
                Assign Lecturer
              </Button>
            )}
          </div>
        )}
      </div>
      <div className="rounded-lg border p-4">
        <h3 className="font-medium mb-2">Schedule</h3>
        {course.schedules && course.schedules.length > 0 ? (
          <p className="text-sm">
            {course.schedules[0]?.dayOfWeek}, {course.schedules[0]?.startTime} – {course.schedules[0]?.endTime}
          </p>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-400 italic">Not yet scheduled</p>
            {canSchedule && (
              <Button variant="outline" size="sm" onClick={() => { onClose(); router.push(`/schedules/create?course=${encodeURIComponent(course.code)}`); }}>
                Add to Schedule
              </Button>
            )}
          </div>
        )}
      </div>
      {canEdit && (
        <Button
          variant="outline"
          className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
          onClick={() => { onClose(); router.push(`/courses/${course.code}/edit`); }}
        >
          Edit Course
        </Button>
      )}
    </div>
  );
}
