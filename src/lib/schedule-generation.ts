import type {
  BatchGenerateScheduleResult,
  DepartmentSchedulingError,
  GenerateScheduleResult,
  Level,
  ScheduleAssignment,
  Semester,
  UnscheduledCourse,
} from "@/types";

export interface ScheduleGenerationSummary {
  sessionName: string;
  semester: Semester;
  departmentCode: string | null;
  programme: string | null;
  level: Level | null;
  totalCourses: number;
  scheduledCount: number;
  failedCount: number;
  preservedOverrides: number;
  skippedLockedDepartments: number;
  totalDepartments: number | null;
  processedDepartments: number | null;
  scheduledCourses: ScheduleAssignment[];
  unscheduledCourses: UnscheduledCourse[];
  departmentErrors: DepartmentSchedulingError[];
}

export function summarizeSingleResult(
  result: GenerateScheduleResult,
): ScheduleGenerationSummary {
  return {
    sessionName: result.sessionName,
    semester: result.semester,
    departmentCode: result.departmentCode,
    programme: result.programme,
    level: result.level,
    totalCourses: result.totalCourses,
    scheduledCount: result.scheduledCount,
    failedCount: result.failedCount,
    preservedOverrides: result.preservedOverrides,
    skippedLockedDepartments: result.skippedLockedDepartments,
    totalDepartments: null,
    processedDepartments: null,
    scheduledCourses: result.scheduledCourses,
    unscheduledCourses: result.unscheduledCourses,
    departmentErrors: [],
  };
}

export function summarizeBatchResult(
  result: BatchGenerateScheduleResult,
): ScheduleGenerationSummary {
  return {
    sessionName: result.sessionName,
    semester: result.semester,
    departmentCode: null,
    programme: result.programme,
    level: null,
    totalCourses: result.totalCourses,
    scheduledCount: result.scheduledCount,
    failedCount: result.failedCount,
    preservedOverrides: result.preservedOverrides,
    skippedLockedDepartments: result.skippedLockedDepartments,
    totalDepartments: result.totalDepartments,
    processedDepartments: result.processedDepartments,
    scheduledCourses: result.scheduledCourses,
    unscheduledCourses: result.unscheduledCourses,
    departmentErrors: result.errors,
  };
}

export function applyManualScheduling(
  summary: ScheduleGenerationSummary,
  assignments: ScheduleAssignment[],
): ScheduleGenerationSummary {
  const resolvedCodes = new Set(assignments.map((a) => a.courseCode));
  const remaining = summary.unscheduledCourses.filter(
    (course) => !resolvedCodes.has(course.courseCode),
  );
  const resolvedCount = summary.unscheduledCourses.length - remaining.length;
  return {
    ...summary,
    scheduledCount: summary.scheduledCount + resolvedCount,
    failedCount: remaining.length,
    scheduledCourses: [...summary.scheduledCourses, ...assignments],
    unscheduledCourses: remaining,
  };
}

export function pluralizeCourses(count: number): string {
  return `${count} ${count === 1 ? "course" : "courses"}`;
}

export function formatGenerationMessage(
  summary: Pick<ScheduleGenerationSummary, "scheduledCount" | "failedCount">,
): string {
  return `Scheduled: ${pluralizeCourses(summary.scheduledCount)}. Failed: ${pluralizeCourses(summary.failedCount)}.`;
}

export function hasGenerationIssues(
  summary: Pick<ScheduleGenerationSummary, "failedCount" | "departmentErrors">,
): boolean {
  return summary.failedCount > 0 || summary.departmentErrors.length > 0;
}
