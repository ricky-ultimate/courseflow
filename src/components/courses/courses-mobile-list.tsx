"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MoreVertical, Lock } from "lucide-react";
import { Course, Semester } from "@/types";
import { LEVEL_PILL } from "@/lib/constants";
import { useState } from "react";

interface CoursesMobileListProps {
  courses: Course[];
  canEditCourse: (c: Course) => boolean;
  isAdmin: boolean;
  onView: (c: Course) => void;
  onDelete: (c: Course) => void;
}

export function CoursesMobileList({
  courses,
  canEditCourse,
  isAdmin,
  onView,
  onDelete,
}: CoursesMobileListProps) {
  const [menuCourse, setMenuCourse] = useState<Course | null>(null);

  return (
    <>
      <div className="md:hidden space-y-3">
        {courses.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer"
            onClick={(e) => {
              if (!(e.target as HTMLElement).closest("[data-menu]")) onView(c);
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-mono text-sm font-semibold">{c.code}</p>
              <Badge variant="secondary" className={LEVEL_PILL[c.level] ?? ""}>
                {c.level.replace("LEVEL_", "")}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{c.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              {c.lecturer?.name ?? "Unassigned"} · {c.department?.name ?? c.departmentCode}
            </p>
            <p className="text-xs text-gray-500">
              {c.semester === Semester.FIRST ? "First" : "Second"} Semester · {c.credits} Credits
            </p>
            <div className="mt-3 pt-3 border-t flex justify-between items-center">
              {c.isLocked ? (
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                  <Lock className="h-3 w-3 mr-1" />Locked
                </Badge>
              ) : c.isActive ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
              ) : (
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inactive</Badge>
              )}
              <div data-menu>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 touch-manipulation"
                  onClick={(e) => { e.stopPropagation(); setMenuCourse(c); }}
                >
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={!!menuCourse} onOpenChange={(o) => !o && setMenuCourse(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{menuCourse?.name ?? "Course actions"}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 py-4">
            {menuCourse && (() => {
              const c = menuCourse;
              const close = () => setMenuCourse(null);
              return (
                <>
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                    onClick={() => { onView(c); close(); }}
                  >
                    View Details
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-left w-full min-h-[52px] font-medium"
                      onClick={() => { onDelete(c); close(); }}
                    >
                      Delete Course
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
