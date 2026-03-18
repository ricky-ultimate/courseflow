"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Trash2, MoreVertical } from "lucide-react";
import { Exam, Course, Level } from "@/types";
import { VENUE_LABELS, LEVEL_PILL } from "@/lib/constants";

const LEVEL_PILL_MAP: Record<string, string> = {
  [Level.LEVEL_100]: LEVEL_PILL[Level.LEVEL_100],
  [Level.LEVEL_200]: LEVEL_PILL[Level.LEVEL_200],
  [Level.LEVEL_300]: LEVEL_PILL[Level.LEVEL_300],
  [Level.LEVEL_400]: LEVEL_PILL[Level.LEVEL_400],
  [Level.LEVEL_500]: LEVEL_PILL[Level.LEVEL_500],
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isCbtCourse(course: Course | null | undefined): boolean {
  if (!course) return false;
  return course.level === Level.LEVEL_100 || !!course.isGeneral;
}

interface ExamTableProps {
  exams: Exam[];
  courses: Course[];
  isAdmin: boolean;
  onEdit: (exam: Exam) => void;
  onDelete: (exam: Exam) => void;
}

export function ExamTable({
  exams,
  courses,
  isAdmin,
  onEdit,
  onDelete,
}: ExamTableProps) {
  return (
    <>
      <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b sticky top-0 z-10">
              <tr className="text-left text-sm text-gray-500">
                {[
                  "Date",
                  "Time",
                  "Course",
                  "Level",
                  "Venue",
                  "Students",
                  "College",
                  "Invigilators",
                ].map((h) => (
                  <th key={h} className="p-3">
                    {h}
                  </th>
                ))}
                {isAdmin && <th className="p-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => {
                const course =
                  exam.course ??
                  courses.find((c) => c.code === exam.courseCode);
                const cbt = isCbtCourse(course);
                return (
                  <tr key={exam.id} className="border-t hover:bg-gray-50">
                    <td className="p-3 text-sm">{formatDate(exam.date)}</td>
                    <td className="p-3 text-sm">
                      {exam.startTime} – {exam.endTime}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {exam.courseCode}
                        </span>
                        {cbt && (
                          <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                            CBT
                          </Badge>
                        )}
                        <span className="text-sm">{course?.name ?? ""}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge
                        variant="secondary"
                        className={
                          LEVEL_PILL_MAP[course?.level ?? ""] ?? "bg-gray-100"
                        }
                      >
                        {course?.level?.replace("LEVEL_", "") ?? "—"}
                      </Badge>
                    </td>
                    <td className="p-3 text-sm">
                      {VENUE_LABELS[exam.venue] ?? exam.venue}
                    </td>
                    <td className="p-3 text-sm">{exam.studentCount}</td>
                    <td className="p-3">
                      {exam.targetCollege ? (
                        <Badge variant="outline" className="text-xs">
                          {exam.targetCollege}
                        </Badge>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td
                      className="p-3 text-sm truncate max-w-[120px]"
                      title={exam.invigilators ?? ""}
                    >
                      {exam.invigilators ?? "—"}
                    </td>
                    {isAdmin && (
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-11 w-11"
                            onClick={() => onEdit(exam)}
                          >
                            <Pencil className="h-5 w-5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-11 w-11 text-red-600"
                            onClick={() => onDelete(exam)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {exams.map((exam) => {
          const course =
            exam.course ?? courses.find((c) => c.code === exam.courseCode);
          const cbt = isCbtCourse(course);
          return (
            <div
              key={exam.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium">
                  {formatDate(exam.date)} {exam.startTime}–{exam.endTime}
                </p>
                {cbt && (
                  <Badge className="bg-indigo-100 text-indigo-700 text-xs shrink-0">
                    CBT
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold mt-2">
                {exam.courseCode} · {course?.name ?? ""}
              </p>
              <p className="text-sm text-gray-500">
                {VENUE_LABELS[exam.venue] ?? exam.venue}
              </p>
              <p className="text-xs text-gray-500">
                {exam.studentCount} students · {exam.targetCollege ?? "—"}
              </p>
              <div className="border-t mt-3 pt-3 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-500 truncate flex-1 min-w-0">
                  {exam.invigilators ?? "—"}
                </p>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11 shrink-0"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(exam)}>
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(exam)}
                      >
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
