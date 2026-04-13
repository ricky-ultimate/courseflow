"use client";

import { Course } from "@/types";
import { Link2 } from "lucide-react";

interface CourseAliasBadgesProps {
  course: Course;
  compact?: boolean;
}

export function CourseAliasBadges({
  course,
  compact = false,
}: CourseAliasBadgesProps) {
  const allAliases: Array<{ code: string; departmentCode: string }> = [
    ...(course.primaryAliases?.map((a) => ({
      code: a.aliasCourse.code,
      departmentCode: a.aliasCourse.departmentCode,
    })) ?? []),
    ...(course.aliasOf?.map((a) => ({
      code: a.primaryCourse.code,
      departmentCode: a.primaryCourse.departmentCode,
    })) ?? []),
  ];

  if (allAliases.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        <Link2 className="h-3 w-3 text-gray-400 shrink-0" />
        {allAliases.map((a) => (
          <span
            key={a.code}
            className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
            title={`Also known as ${a.code} in ${a.departmentCode}`}
          >
            {a.code}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Link2 className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
      <span className="text-xs text-gray-500">Also:</span>
      {allAliases.map((a) => (
        <span
          key={a.code}
          className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100"
          title={`Cross-listed as ${a.code} in ${a.departmentCode}`}
        >
          {a.code}
        </span>
      ))}
    </div>
  );
}
