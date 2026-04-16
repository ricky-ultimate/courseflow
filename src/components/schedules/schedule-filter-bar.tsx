"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { AcademicSession, Department, Level, Semester } from "@/types";

const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

export interface Programme {
  programme: string;
  count: number;
}

interface ScheduleFilterBarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  selectedSessionId: string;
  onSessionChange: (v: string) => void;
  selectedSemester: string;
  onSemesterChange: (v: string) => void;
  selectedDepartment: string;
  onDepartmentChange: (v: string) => void;
  selectedProgramme: string;
  onProgrammeChange: (v: string) => void;
  selectedLevel: string;
  onLevelChange: (v: string) => void;
  sessions: AcademicSession[];
  departments: Department[];
  programmes: Programme[];
  filterCount: number;
  onClear: () => void;
  myClassesOnly: boolean;
  onMyClassesOnlyChange: (v: boolean) => void;
  showMyClassesFilter: boolean;
}

export function ScheduleFilterBar({
  searchTerm,
  onSearchChange,
  selectedSessionId,
  onSessionChange,
  selectedSemester,
  onSemesterChange,
  selectedDepartment,
  onDepartmentChange,
  selectedProgramme,
  onProgrammeChange,
  selectedLevel,
  onLevelChange,
  sessions,
  departments,
  programmes,
  filterCount,
  onClear,
  myClassesOnly,
  onMyClassesOnlyChange,
  showMyClassesFilter,
}: ScheduleFilterBarProps) {
  const showProgramme =
    selectedDepartment !== "all" &&
    !!selectedDepartment &&
    programmes.length > 1;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-sm w-full">
      <div className="relative flex-1 w-full">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-0 bg-transparent shadow-none focus-visible:ring-0 pl-9 h-10 w-full"
        />
      </div>
      <div className="h-6 w-px bg-slate-200 hidden sm:block" />
      <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar px-1">
        {showMyClassesFilter && (
          <button
            type="button"
            onClick={() => onMyClassesOnlyChange(!myClassesOnly)}
            className={`shrink-0 text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${myClassesOnly ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"}`}
          >
            My Classes
          </button>
        )}

        <Select
          value={selectedSessionId || "all"}
          onValueChange={(v) => onSessionChange(v === "all" ? "" : v)}
        >
          <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[140px]">
            <SelectValue placeholder="Session" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSemester} onValueChange={onSemesterChange}>
          <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[130px]">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value={Semester.FIRST}>First</SelectItem>
            <SelectItem value={Semester.SECOND}>Second</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedDepartment} onValueChange={onDepartmentChange}>
          <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[140px]">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept.code} value={dept.code}>
                {dept.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {showProgramme && (
          <Select value={selectedProgramme} onValueChange={onProgrammeChange}>
            <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[130px]">
              <SelectValue placeholder="Programme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Programmes</SelectItem>
              {programmes.map((p) => (
                <SelectItem key={p.programme} value={p.programme}>
                  {p.programme}
                  <span className="ml-1.5 text-xs text-slate-400">
                    ({p.count})
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={selectedLevel} onValueChange={onLevelChange}>
          <SelectTrigger className="border-0 shadow-none bg-transparent hover:bg-slate-50 focus:ring-0 w-[110px]">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {LEVEL_OPTIONS.map((lvl) => (
              <SelectItem key={lvl.value} value={lvl.value}>
                {lvl.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {filterCount > 0 && (
          <button
            onClick={onClear}
            className="text-xs text-slate-500 hover:text-slate-800 ml-2 px-2 whitespace-nowrap"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
