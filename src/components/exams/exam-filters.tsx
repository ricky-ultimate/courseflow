"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { Filter } from "lucide-react";
import { AcademicSession, Semester } from "@/types";

interface ExamFiltersProps {
  searchInput: string;
  onSearchChange: (v: string) => void;
  sessionId: string;
  onSessionChange: (v: string) => void;
  semester: string;
  onSemesterChange: (v: string) => void;
  sessions: AcademicSession[];
  filtersOpen: boolean;
  onFiltersOpenChange: (v: boolean) => void;
  limit: number;
  onLimitChange: (v: number) => void;
  onPageReset: () => void;
}

export function ExamFilters({
  searchInput,
  onSearchChange,
  sessionId,
  onSessionChange,
  semester,
  onSemesterChange,
  sessions,
  filtersOpen,
  onFiltersOpenChange,
  limit,
  onLimitChange,
  onPageReset,
}: ExamFiltersProps) {
  const handleSessionChange = (v: string) => {
    onSessionChange(v === "all" ? "" : v);
    onPageReset();
  };

  const handleSemesterChange = (v: string) => {
    onSemesterChange(v);
    onPageReset();
  };

  return (
    <>
      <FilterBar
        searchValue={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search by course code or name..."
      >
        <div className="hidden md:flex items-center gap-1">
          <FilterSelect
            value={sessionId || "all"}
            onValueChange={handleSessionChange}
            width="w-[160px]"
          >
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect
            value={semester}
            onValueChange={handleSemesterChange}
            width="w-[150px]"
          >
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
            <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
          </FilterSelect>
        </div>
        <Button
          variant="outline"
          className="md:hidden rounded-full"
          onClick={() => onFiltersOpenChange(true)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </FilterBar>

      <Dialog open={filtersOpen} onOpenChange={onFiltersOpenChange}>
        <DialogContent
          className="md:max-w-[400px]"
          onSwipeDown={() => onFiltersOpenChange(false)}
        >
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Session</Label>
              <Select
                value={sessionId || "all"}
                onValueChange={handleSessionChange}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
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
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={semester} onValueChange={handleSemesterChange}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                  <SelectItem value={Semester.SECOND}>
                    Second Semester
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Per page</Label>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  onLimitChange(Number(v));
                  onPageReset();
                  onFiltersOpenChange(false);
                }}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => onFiltersOpenChange(false)}>
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
