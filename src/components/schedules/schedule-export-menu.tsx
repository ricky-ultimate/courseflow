"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileDown, FileText, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import {
  exportAsPDF,
  exportAsXLSX,
  exportAsCSV,
  exportAsPNG,
} from "@/lib/schedule-export";
import { Course, Schedule } from "@/types";

interface ScheduleExportMenuProps {
  filters: {
    departmentCode: string;
    programme?: string;
    level: string;
    day: string;
    searchTerm: string;
  };
  fallbackSchedules: Schedule[];
}

export function ScheduleExportMenu({
  filters,
  fallbackSchedules,
}: ScheduleExportMenuProps) {
  const { toast } = useToast();

  const fetchAllSchedulesForExport = async (): Promise<Schedule[]> => {
    try {
      const params: Record<string, unknown> = { page: 1, limit: 10000 };
      if (filters.departmentCode && filters.departmentCode !== "all")
        params.departmentCode = filters.departmentCode;
      if (
        filters.programme &&
        filters.programme !== "all" &&
        filters.departmentCode !== "all"
      )
        params.programme = filters.programme;
      if (filters.level && filters.level !== "all")
        params.level = filters.level;
      if (filters.day && filters.day !== "all") params.dayOfWeek = filters.day;
      if (filters.searchTerm) params.searchTerm = filters.searchTerm;

      const response = await apiClient.getSchedules(params);
      const result = getItemsFromResponse<Schedule>(response);
      let allSchedules = result?.items ?? [];

      const courseCodes = Array.from(
        new Set(allSchedules.map((s) => s.courseCode).filter(Boolean)),
      );
      if (courseCodes.length > 0) {
        try {
          const coursesResponse = await apiClient.getCourses({ limit: 10000 });
          const coursesResult = getItemsFromResponse<Course>(coursesResponse);
          const courses = coursesResult?.items ?? [];
          if (courses.length > 0) {
            const courseMap = new Map<string, Course>();
            courses.forEach((c) => c.code && courseMap.set(c.code, c));
            allSchedules = allSchedules.map((schedule) => {
              if (
                schedule.courseCode &&
                courseMap.has(schedule.courseCode) &&
                schedule.course
              ) {
                const enriched = courseMap.get(schedule.courseCode)!;
                return {
                  ...schedule,
                  course: {
                    ...schedule.course,
                    lecturer: enriched.lecturer ?? schedule.course.lecturer,
                  },
                } as Schedule;
              }
              return schedule;
            });
          }
        } catch {
          // proceed with unenriched schedules
        }
      }
      return allSchedules;
    } catch {
      return fallbackSchedules;
    }
  };

  const runExport = async (
    fn: (s: Schedule[]) => Promise<void>,
    label: string,
  ) => {
    try {
      toast({
        title: "Preparing Export",
        description: "Fetching all schedules...",
      });
      const allSchedules = await fetchAllSchedulesForExport();
      if (!allSchedules.length) {
        toast({
          title: "No Schedules",
          description: "There are no schedules to export",
          variant: "destructive",
        });
        return;
      }
      await fn(allSchedules);
      toast({
        title: "Export Successful",
        description: `Timetable exported as ${label} (${allSchedules.length} schedules)`,
      });
    } catch {
      toast({
        title: "Export Error",
        description: `An error occurred while exporting ${label}`,
        variant: "destructive",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full shadow-sm">
          <FileDown className="h-4 w-4 mr-2 text-slate-500" />
          Export
          <ChevronDown className="h-3 w-3 ml-2 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-lg">
        <DropdownMenuItem
          onClick={() => runExport(exportAsPDF, "PDF")}
          className="cursor-pointer py-2"
        >
          <FileText className="h-4 w-4 mr-2" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => runExport(exportAsXLSX, "XLSX")}
          className="cursor-pointer py-2"
        >
          <FileText className="h-4 w-4 mr-2" />
          Excel (XLSX)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => runExport(exportAsCSV, "CSV")}
          className="cursor-pointer py-2"
        >
          <FileText className="h-4 w-4 mr-2" />
          CSV File
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => runExport(exportAsPNG, "PNG")}
          className="cursor-pointer py-2"
        >
          <FileText className="h-4 w-4 mr-2" />
          Image (PNG)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
