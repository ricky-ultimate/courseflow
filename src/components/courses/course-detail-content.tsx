"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Lock,
  BookOpen,
  Calendar,
  User,
  Building2,
  Pencil,
  Clock,
  GraduationCap,
} from "lucide-react";
import { Course, AcademicSession, Department, Semester, Level } from "@/types";
import { getInitials } from "@/lib/utils";
import { LEVEL_PILL } from "@/lib/constants";
import { CourseEditModal } from "@/components/courses/course-edit-modal";
import { CourseAliasPanel } from "./course-alias-panel";
import { CourseAliasBadges } from "./course-alias-badges";

interface CourseDetailContentProps {
  course: Course;
  sessions: AcademicSession[];
  departments: Department[];
  canEdit: boolean;
  canSchedule: boolean;
  onClose: () => void;
  onCourseUpdated?: (updated: Course) => void;
}

function getLevelLabel(level: string): string {
  return level.replace("LEVEL_", "") + " Level";
}

export function CourseDetailContent({
  course: initialCourse,
  sessions,
  departments,
  canEdit,
  canSchedule,
  onClose,
  onCourseUpdated,
}: CourseDetailContentProps) {
  const router = useRouter();
  const [course, setCourse] = useState(initialCourse);
  const [editOpen, setEditOpen] = useState(false);

  const schedule = course.schedules?.[0];
  const sessionName = schedule?.sessionId
    ? (sessions.find((s) => s.id === schedule.sessionId)?.name ?? null)
    : null;

  const deptName =
    course.department?.name ??
    departments.find((d) => d.code === course.departmentCode)?.name ??
    course.departmentCode;

  const handleEditSuccess = (updated: Course) => {
    setCourse(updated);
    setEditOpen(false);
    onCourseUpdated?.(updated);
  };

  return (
    <>
      <div className="pt-12 md:pt-0 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                {course.code}
              </span>
              <CourseAliasBadges course={course} />
              <Badge
                variant="secondary"
                className={`text-xs ${LEVEL_PILL[course.level] ?? ""}`}
              >
                {getLevelLabel(course.level)}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-gray-900 leading-snug">
              {course.name}
            </h2>
          </div>
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-9"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {course.isActive ? (
            <Badge className="bg-green-100 text-green-700 border-green-200">
              Active
            </Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-100 text-gray-600">
              Inactive
            </Badge>
          )}
          <Badge variant="secondary" className="bg-slate-100 text-slate-600">
            {course.isGeneral ? "General / GST" : "Departmental"}
          </Badge>
          {course.isLocked && (
            <Badge className="bg-amber-100 text-amber-700 border-amber-200">
              <Lock className="h-3 w-3 mr-1" />
              Locked
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Semester
            </span>
            <span className="text-sm font-medium text-gray-800">
              {course.semester === Semester.FIRST
                ? "First Semester"
                : "Second Semester"}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Credits
            </span>
            <span className="text-sm font-medium text-gray-800">
              {course.credits} units
            </span>
          </div>
          <div className="flex flex-col gap-1 col-span-2">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
              Department
            </span>
            <div className="flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
              <span className="text-sm font-medium text-gray-800">
                {deptName}
              </span>
            </div>
          </div>
        </div>

        {course.overview && (
          <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
              Overview
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {course.overview}
            </p>
          </div>
        )}

        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <User className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">
              Lecturer
            </span>
          </div>
          <div className="p-4">
            {course.lecturer ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 shrink-0">
                  {getInitials(course.lecturer.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 text-sm">
                    {course.lecturer.name ?? course.lecturer.email}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {course.lecturer.email}
                  </p>
                  {course.lecturer.departmentCode && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {departments.find(
                        (d) => d.code === course.lecturer?.departmentCode,
                      )?.name ?? course.lecturer.departmentCode}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 italic">
                  No lecturer assigned
                </p>
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setEditOpen(true)}
                  >
                    Assign
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
            <Calendar className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-semibold text-gray-700">
              Schedule
            </span>
            {sessionName && (
              <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 rounded px-2 py-0.5">
                {sessionName}
              </span>
            )}
          </div>
          <div className="p-4">
            {schedule ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">
                    {schedule.dayOfWeek.charAt(0) +
                      schedule.dayOfWeek.slice(1).toLowerCase()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {schedule.startTime} – {schedule.endTime}
                  </span>
                </div>
                {!sessionName && (
                  <p className="text-xs text-gray-400">
                    Session info unavailable
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400 italic">
                  Not yet scheduled
                </p>
                {canSchedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      onClose();
                      router.push(
                        `/schedules?create=1&course=${encodeURIComponent(course.code)}`,
                      );
                    }}
                  >
                    Add to Schedule
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <CourseAliasPanel courseCode={course.code} canEdit={canEdit} />

      <CourseEditModal
        course={editOpen ? course : null}
        onClose={() => setEditOpen(false)}
        onSuccess={handleEditSuccess}
      />
    </>
  );
}
