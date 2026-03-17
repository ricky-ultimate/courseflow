"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { Filter } from "lucide-react";
import { Department, Level, Semester } from "@/types";

interface CourseFiltersProps {
  searchInput: string;
  onSearchChange: (v: string) => void;
  departmentCode: string;
  onDepartmentChange: (v: string) => void;
  level: string;
  onLevelChange: (v: string) => void;
  semester: string;
  onSemesterChange: (v: string) => void;
  isGeneral: boolean;
  onIsGeneralChange: (v: boolean) => void;
  departments: Department[];
  filterCount: number;
  hasFilters: boolean;
  onClearFilters: () => void;
  limit: number;
  onLimitChange: (v: number) => void;
}

const LEVEL_OPTIONS = [Level.LEVEL_100, Level.LEVEL_200, Level.LEVEL_300, Level.LEVEL_400, Level.LEVEL_500];

export function CourseFilters({
  searchInput, onSearchChange, departmentCode, onDepartmentChange,
  level, onLevelChange, semester, onSemesterChange, isGeneral, onIsGeneralChange,
  departments, filterCount, hasFilters, onClearFilters, limit, onLimitChange,
}: CourseFiltersProps) {
  const [filtersOpen, setFiltersOpen] = [false, (_: boolean) => {}];

  return (
    <>
      <FilterBar searchValue={searchInput} onSearchChange={onSearchChange} searchPlaceholder="Search by code, name or lecturer...">
        <div className="hidden md:flex items-center gap-1">
          <FilterSelect value={departmentCode} onValueChange={onDepartmentChange} width="w-[160px]">
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>)}
          </FilterSelect>
          <FilterSelect value={level} onValueChange={onLevelChange} width="w-[130px]">
            <SelectItem value="all">All Levels</SelectItem>
            {LEVEL_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l.replace("LEVEL_", "")} Level</SelectItem>)}
          </FilterSelect>
          <FilterSelect value={semester} onValueChange={onSemesterChange} width="w-[150px]">
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
            <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
          </FilterSelect>
          {departmentCode === "all" && (
            <button type="button" onClick={() => onIsGeneralChange(!isGeneral)}
              className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${isGeneral ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}>
              General only
            </button>
          )}
          {hasFilters && (
            <button type="button" className="text-sm text-slate-500 hover:text-slate-800 px-2" onClick={onClearFilters}>Clear</button>
          )}
        </div>
      </FilterBar>
    </>
  );
}

export function CourseFiltersMobile({
  departmentCode, onDepartmentChange, level, onLevelChange, semester, onSemesterChange,
  isGeneral, onIsGeneralChange, departments, filterCount, onClearFilters, limit, onLimitChange,
}: Omit<CourseFiltersProps, "searchInput" | "onSearchChange" | "hasFilters">) {
  const [open, setOpen] = [false, (_: boolean) => {}];

  return null;
}

export function CourseFiltersMobileDialog({
  departmentCode, onDepartmentChange, level, onLevelChange, semester, onSemesterChange,
  isGeneral, onIsGeneralChange, departments, filterCount, onClearFilters, limit, onLimitChange,
  open, onOpenChange,
}: Omit<CourseFiltersProps, "searchInput" | "onSearchChange" | "hasFilters"> & { open: boolean; onOpenChange: (v: boolean) => void }) {
  const LEVEL_OPTIONS = [Level.LEVEL_100, Level.LEVEL_200, Level.LEVEL_300, Level.LEVEL_400, Level.LEVEL_500];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-[400px]" onSwipeDown={() => onOpenChange(false)}>
        <DialogHeader><DialogTitle>Filters</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Department</label>
            <Select value={departmentCode} onValueChange={onDepartmentChange}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Level</label>
            <Select value={level} onValueChange={onLevelChange}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {LEVEL_OPTIONS.map((l) => <SelectItem key={l} value={l}>{l.replace("LEVEL_", "")} Level</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Semester</label>
            <Select value={semester} onValueChange={onSemesterChange}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {departmentCode === "all" && (
            <div>
              <label className="text-sm font-medium">General Only</label>
              <Button variant={isGeneral ? "default" : "outline"} className="w-full mt-1.5" onClick={() => onIsGeneralChange(!isGeneral)}>
                {isGeneral ? "On" : "Off"}
              </Button>
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Per page</label>
            <Select value={String(limit)} onValueChange={(v) => { onLimitChange(Number(v)); onOpenChange(false); }}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full" onClick={() => onOpenChange(false)}>Apply</Button>
          <button type="button" className="text-sm text-gray-500 underline" onClick={() => { onClearFilters(); onOpenChange(false); }}>Clear All</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
