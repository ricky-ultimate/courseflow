"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Trash2, Lock } from "lucide-react";
import { Course, Semester } from "@/types";
import { LEVEL_PILL } from "@/lib/constants";

interface CoursesTableProps {
  courses: Course[];
  canEditCourse: (c: Course) => boolean;
  isAdmin: boolean;
  onView: (c: Course) => void;
  onDelete: (c: Course) => void;
}

export function CoursesTable({
  courses,
  canEditCourse,
  isAdmin,
  onView,
  onDelete,
}: CoursesTableProps) {
  return (
    <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-white border-b sticky top-0 z-10">
            <tr className="text-left text-sm text-gray-500">
              <th className="p-3 w-[100px]">Code</th>
              <th className="p-3">Name</th>
              <th className="p-3 w-[100px]">Level</th>
              <th className="p-3 w-[80px] hidden lg:table-cell">Semester</th>
              <th className="p-3 w-[70px] hidden lg:table-cell text-center">
                Credits
              </th>
              <th className="p-3 w-[90px]">Dept</th>
              <th className="p-3 w-[160px]">Lecturer</th>
              <th className="p-3 w-[80px] hidden lg:table-cell">Status</th>
              <th className="p-3 w-[60px] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr
                key={c.id}
                className="border-t hover:bg-gray-50 cursor-pointer"
                onClick={() => onView(c)}
              >
                <td className="p-3" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {c.code}
                  </span>
                </td>
                <td className="p-3 text-sm">{c.name}</td>
                <td className="p-3">
                  <Badge
                    variant="secondary"
                    className={LEVEL_PILL[c.level] ?? ""}
                  >
                    {c.level.replace("LEVEL_", "")}
                  </Badge>
                </td>
                <td className="p-3 text-sm hidden lg:table-cell">
                  {c.semester === Semester.FIRST ? "First" : "Second"}
                </td>
                <td className="p-3 text-center text-sm hidden lg:table-cell">
                  {c.credits}
                </td>
                <td className="p-3">
                  <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">
                    {c.departmentCode}
                  </span>
                </td>
                <td className="p-3 text-sm">
                  {c.lecturer ? (
                    (c.lecturer.name ?? c.lecturer.email)
                  ) : (
                    <span className="italic text-gray-400">Unassigned</span>
                  )}
                </td>
                <td className="p-3 hidden lg:table-cell">
                  {c.isLocked ? (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-700"
                    >
                      <Lock className="h-3 w-3 mr-1 inline" />
                      Locked
                    </Badge>
                  ) : c.isActive ? (
                    <Badge
                      variant="secondary"
                      className="bg-green-100 text-green-700"
                    >
                      Active
                    </Badge>
                  ) : (
                    <Badge
                      variant="secondary"
                      className="bg-gray-100 text-gray-600"
                    >
                      Inactive
                    </Badge>
                  )}
                </td>
                <td
                  className="p-3 text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isAdmin && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-11 w-11 text-red-600 touch-manipulation"
                      onClick={() => onDelete(c)}
                    >
                      <Trash2 className="h-5 w-5" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
