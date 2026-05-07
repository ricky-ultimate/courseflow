"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BookOpen,
  Eye,
  Lock,
  MoreVertical,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Course, Semester } from "@/types";
import { LEVEL_PILL } from "@/lib/constants";

interface DepartmentCoursesSectionProps {
  courses: Course[];
  departmentCode: string;
  isAdmin: boolean;
  isHod: boolean;
  canAddCourse: boolean;
  canGenerateSchedule: boolean;
  canEditCourse: (c: Course) => boolean;
  onView: (c: Course) => void;
  onDelete: (c: Course) => void;
  onGenerateSchedule: () => void;
  onAddCourse?: () => void;
}

export function DepartmentCoursesSection({
  courses,
  isAdmin,
  canAddCourse,
  canGenerateSchedule,
  canEditCourse,
  onView,
  onDelete,
  onGenerateSchedule,
  onAddCourse,
}: DepartmentCoursesSectionProps) {
  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Courses in this Department</h2>
        <div className="flex items-center gap-2">
          {canGenerateSchedule && (
            <Button variant="outline" size="sm" onClick={onGenerateSchedule}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate Schedule
            </Button>
          )}
          {canAddCourse && onAddCourse && (
            <Button size="sm" onClick={onAddCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          )}
        </div>
      </div>

      {courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              No courses in this department
            </p>
            {canAddCourse && onAddCourse && (
              <Button className="mt-4" onClick={onAddCourse}>
                <Plus className="h-4 w-4 mr-2" />
                Add Course
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b sticky top-0 z-10">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-3 w-[100px]">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3 w-[100px]">Level</th>
                    <th className="p-3 w-[80px] hidden lg:table-cell">
                      Semester
                    </th>
                    <th className="p-3 w-[70px] hidden lg:table-cell text-center">
                      Credits
                    </th>
                    <th className="p-3 w-[160px]">Lecturer</th>
                    <th className="p-3 w-[120px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
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
                      <td className="p-3 text-sm">
                        {c.lecturer ? (
                          (c.lecturer.name ?? c.lecturer.email)
                        ) : (
                          <span className="italic text-gray-400">
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-11 w-11"
                            onClick={() => onView(c)}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                          {isAdmin && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-11 w-11 text-red-600"
                              onClick={() => onDelete(c)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                onClick={() => onView(c)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-sm font-semibold">{c.code}</p>
                    <p className="text-sm text-gray-600 truncate">{c.name}</p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={LEVEL_PILL[c.level] ?? ""}
                  >
                    {c.level.replace("LEVEL_", "")}
                  </Badge>
                  <div data-menu onClick={(e) => e.stopPropagation()}>
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
                        <DropdownMenuItem onClick={() => onView(c)}>
                          View Details
                        </DropdownMenuItem>
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => onDelete(c)}
                            >
                              Delete Course
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {c.lecturer?.name ?? "Unassigned"} ·{" "}
                  {c.department?.name ?? c.departmentCode}
                </p>
                <p className="text-xs text-gray-500">
                  {c.semester === Semester.FIRST ? "First" : "Second"} Semester
                  · {c.credits} Credits
                </p>
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  {c.isLocked ? (
                    <Badge
                      variant="secondary"
                      className="bg-amber-100 text-amber-700"
                    >
                      <Lock className="h-3 w-3 mr-1" />
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
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
