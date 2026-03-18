"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { ErrorState } from "@/components/state/error-state";
import { ClipboardList, CalendarDays, MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Exam, Course, AcademicSession, Semester, Level } from "@/types";
import { VENUE_LABELS, LEVEL_PILL } from "@/lib/constants";

const LEVEL_PILL_MAP: Record<string, string> = {
  [Level.LEVEL_100]: LEVEL_PILL[Level.LEVEL_100],
  [Level.LEVEL_200]: LEVEL_PILL[Level.LEVEL_200],
  [Level.LEVEL_300]: LEVEL_PILL[Level.LEVEL_300],
  [Level.LEVEL_400]: LEVEL_PILL[Level.LEVEL_400],
  [Level.LEVEL_500]: LEVEL_PILL[Level.LEVEL_500],
};

const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100" },
  { value: Level.LEVEL_200, label: "200" },
  { value: Level.LEVEL_300, label: "300" },
  { value: Level.LEVEL_400, label: "400" },
  { value: Level.LEVEL_500, label: "500" },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

function getDaysUntil(iso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const examDate = new Date(iso);
  examDate.setHours(0, 0, 0, 0);
  return Math.round((examDate.getTime() - today.getTime()) / 86400000);
}

function isCbtCourse(course: Course | null | undefined): boolean {
  if (!course) return false;
  return course.level === Level.LEVEL_100 || !!course.isGeneral;
}

interface ExamStudentViewProps {
  exams: Exam[];
  courses: Course[];
  sessions: AcademicSession[];
  loading: boolean;
  refetching: boolean;
  fetchError: string | null;
  searchInput: string;
  onSearchChange: (v: string) => void;
  sessionId: string;
  onSessionChange: (v: string) => void;
  semester: string;
  onSemesterChange: (v: string) => void;
  studentLevelFilter: string;
  onStudentLevelFilterChange: (v: string) => void;
  onRetry: () => void;
}

export function ExamStudentView({
  exams,
  courses,
  sessions,
  loading,
  refetching,
  fetchError,
  searchInput,
  onSearchChange,
  sessionId,
  onSessionChange,
  semester,
  onSemesterChange,
  studentLevelFilter,
  onStudentLevelFilterChange,
  onRetry,
}: ExamStudentViewProps) {
  const filtered = useMemo(() => {
    let result = exams;
    if (searchInput.trim()) {
      const term = searchInput.toLowerCase();
      result = result.filter((exam) => {
        const code = (exam.course?.code ?? exam.courseCode ?? "").toLowerCase();
        const name = (exam.course?.name ?? "").toLowerCase();
        return code.includes(term) || name.includes(term);
      });
    }
    if (studentLevelFilter !== "all") {
      result = result.filter(
        (exam) => (exam.course?.level ?? "") === studentLevelFilter
      );
    }
    return result;
  }, [exams, searchInput, studentLevelFilter]);

  const today = new Date().toISOString().slice(0, 10);

  const upcomingExams = useMemo(
    () =>
      [...filtered]
        .filter((e) => e.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [filtered, today]
  );

  const pastExams = useMemo(
    () =>
      [...filtered]
        .filter((e) => e.date < today)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [filtered, today]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Exams
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Your upcoming and past examinations
        </p>
      </div>

      <FilterBar
        searchValue={searchInput}
        onSearchChange={onSearchChange}
        searchPlaceholder="Search by course code or name..."
      >
        <FilterSelect
          value={sessionId || "all"}
          onValueChange={(v) => onSessionChange(v === "all" ? "" : v)}
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
          onValueChange={onSemesterChange}
          width="w-[150px]"
        >
          <SelectItem value="all">All Semesters</SelectItem>
          <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
          <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
        </FilterSelect>
      </FilterBar>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => onStudentLevelFilterChange("all")}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
            studentLevelFilter === "all"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
          }`}
        >
          All Levels
        </button>
        {LEVEL_OPTIONS.map((l) => (
          <button
            key={l.value}
            type="button"
            onClick={() => onStudentLevelFilterChange(l.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              studentLevelFilter === l.value
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {l.label}L
          </button>
        ))}
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="exams" onRetry={onRetry} />
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse"
            >
              <div className="flex justify-between gap-2">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
                <div className="h-10 w-16 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 p-12 text-center">
          <ClipboardList className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">
            No exams found
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            No exams match your current filters.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {refetching && <RefetchIndicator />}

          {upcomingExams.length > 0 && (
            <ExamGroup
              title="Upcoming"
              exams={upcomingExams}
              courses={courses}
              showCountdown
            />
          )}
          {pastExams.length > 0 && (
            <ExamGroup
              title="Past"
              exams={pastExams}
              courses={courses}
              showCountdown={false}
            />
          )}
        </div>
      )}
    </div>
  );
}

function ExamGroup({
  title,
  exams,
  courses,
  showCountdown,
}: {
  title: string;
  exams: Exam[];
  courses: Course[];
  showCountdown: boolean;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
        {title}
      </h2>
      {exams.map((exam) => {
        const course =
          exam.course ?? courses.find((c) => c.code === exam.courseCode);
        const cbt = isCbtCourse(course);
        const daysUntil = getDaysUntil(exam.date);
        const isToday = daysUntil === 0;
        const isTomorrow = daysUntil === 1;
        const isSoon = daysUntil <= 7 && daysUntil >= 0;

        return (
          <div
            key={exam.id}
            className={`rounded-xl border bg-white p-4 shadow-sm ${
              !showCountdown
                ? "border-gray-200 opacity-70"
                : isToday
                ? "border-red-200 bg-red-50/30"
                : isSoon
                ? "border-amber-200"
                : "border-gray-200"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                    {exam.courseCode}
                  </span>
                  {course?.level && (
                    <Badge
                      variant="secondary"
                      className={`text-xs shrink-0 ${
                        LEVEL_PILL_MAP[course.level] ?? ""
                      }`}
                    >
                      {course.level.replace("LEVEL_", "")}L
                    </Badge>
                  )}
                  {cbt && (
                    <Badge className="bg-indigo-100 text-indigo-700 text-xs shrink-0">
                      CBT
                    </Badge>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {course?.name ?? exam.courseCode}
                </p>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {formatDate(exam.date)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {exam.startTime} – {exam.endTime}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 shrink-0" />
                    {VENUE_LABELS[exam.venue] ?? exam.venue}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                {showCountdown ? (
                  isToday ? (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                      Today
                    </span>
                  ) : isTomorrow ? (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                      Tomorrow
                    </span>
                  ) : isSoon ? (
                    <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-600">
                      {daysUntil}d
                    </span>
                  ) : (
                    <span className="text-sm font-semibold text-gray-700">
                      {formatDateShort(exam.date)}
                    </span>
                  )
                ) : (
                  <span className="text-xs text-gray-400 font-medium">
                    {formatDateShort(exam.date)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
