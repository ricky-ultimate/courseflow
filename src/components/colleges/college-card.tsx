"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, ChevronRight } from "lucide-react";
import { College } from "@/types";
import { CollegeData } from "@/hooks/use-colleges";
import { COLLEGE_BADGE } from "@/lib/constants";

const COLLEGE_ICON_COLOR: Record<College, string> = {
  [College.CBAS]: "text-blue-600",
  [College.CHMS]: "text-purple-600",
  [College.CAHS]: "text-emerald-600",
};

const COLLEGE_BG: Record<College, string> = {
  [College.CBAS]: "bg-blue-50",
  [College.CHMS]: "bg-purple-50",
  [College.CAHS]: "bg-emerald-50",
};

interface CollegeCardProps {
  college: CollegeData;
  onViewDepartments: () => void;
}

export function CollegeCard({ college, onViewDepartments }: CollegeCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <Badge
          variant="outline"
          className={COLLEGE_BADGE[college.code] ?? "bg-gray-100 text-gray-700"}
        >
          {college.code}
        </Badge>
        <div
          className={`w-10 h-10 rounded-full ${COLLEGE_BG[college.code] ?? "bg-gray-50"} flex items-center justify-center shrink-0`}
        >
          <Building2
            className={`h-5 w-5 ${COLLEGE_ICON_COLOR[college.code] ?? "text-gray-600"}`}
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-bold text-gray-900 leading-snug">
          {college.name}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Departments</p>
          <p className="text-2xl font-bold text-gray-900">
            {college.totalDepartments}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 px-3 py-2">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-2xl font-bold text-gray-900">
            {college.departments.filter((d) => d.isActive).length}
          </p>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full justify-between"
        onClick={onViewDepartments}
      >
        View Departments
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
