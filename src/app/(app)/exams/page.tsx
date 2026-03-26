"use client";

import { useMemo, useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClipboardList, Plus, RefreshCw, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/state/error-state";
import { Pagination } from "@/components/ui/pagination";
import { ExamForm } from "@/components/exams/exam-form";
import { ExamFilters } from "@/components/exams/exam-filters";
import { ExamTable } from "@/components/exams/exam-table";
import { ExamStudentView } from "@/components/exams/exam-student-view";
import { useExams, useExamMutations } from "@/hooks/use-exams";
import { Exam, Course, VenueType, ICT_VENUES, Level } from "@/types";
import { GenerateExamTimetableModal } from "@/components/exams/generate-exam-timetable-modal";

function isCbtCourse(course: Course | null | undefined): boolean {
  if (!course) return false;
  return course.level === Level.LEVEL_100 || !!course.isGeneral;
}

function createExamSchema(courses: Course[]) {
  return z
    .object({
      courseCode: z.string().min(1, "Course is required"),
      venue: z.nativeEnum(VenueType),
      date: z.string().min(1, "Date is required"),
      startTime: z.string().min(1, "Start time is required"),
      endTime: z.string().min(1, "End time is required"),
      studentCount: z
        .union([z.number(), z.string()])
        .transform((v) => {
          const n = typeof v === "string" ? parseInt(v, 10) : v;
          return isNaN(n as number) ? 1 : (n as number);
        })
        .pipe(z.number().min(1)),
      invigilators: z.string().optional(),
      targetCollege: z.string().optional(),
    })
    .refine(
      (d) => {
        const [sh, sm] = d.startTime.split(":").map(Number);
        const [eh, em] = d.endTime.split(":").map(Number);
        return (eh ?? 0) * 60 + (em ?? 0) > (sh ?? 0) * 60 + (sm ?? 0);
      },
      { message: "End time must be after start time", path: ["endTime"] },
    )
    .superRefine((data, ctx) => {
      const course = courses.find((c) => c.code === data.courseCode);
      if (
        course &&
        isCbtCourse(course) &&
        !ICT_VENUES.includes(data.venue as VenueType)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "CBT courses require an ICT venue",
          path: ["venue"],
        });
      }
      if (course?.isGeneral && !data.targetCollege) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "General courses require Target College",
          path: ["targetCollege"],
        });
      }
    });
}

export default function ExamsPage() {
  const { isAdmin, isStudent, user } = useAuth();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [semester, setSemester] = useState<string>("all");
  const [studentLevelFilter, setStudentLevelFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    exams,
    courses,
    sessions,
    loading,
    refetching,
    total,
    totalPages,
    fetchError,
    refetch,
  } = useExams({
    sessionId,
    semester,
    page,
    limit,
    isStudent: !!isStudent,
    departmentCode: user?.departmentCode,
  });

  usePageLoadReporter(loading);

  useEffect(() => {
    if (sessions.length && !sessionId) {
      setSessionId(sessions[0]!.id);
    }
  }, [sessions, sessionId]);

  const examSchema = useMemo(() => createExamSchema(courses), [courses]);
  type ExamFormValues = z.infer<ReturnType<typeof createExamSchema>>;

  const defaultFormValues = {
    courseCode: "",
    venue: VenueType.LECTURE_HALL_1,
    date: "",
    startTime: "",
    endTime: "",
    studentCount: 1,
    invigilators: "",
    targetCollege: undefined,
  };

  const createForm = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    mode: "onBlur",
    defaultValues: defaultFormValues,
  });
  const editForm = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    mode: "onBlur",
    defaultValues: defaultFormValues,
  });

  const {
    creating,
    createError,
    setCreateError,
    editLoading,
    editError,
    setEditError,
    actionLoading,
    openForEditExamIdRef,
    openEditExam,
    handleCreate,
    handleEditSubmit,
    handleDelete,
  } = useExamMutations(courses, refetch, exams, page, setPage);

  const filteredExams = useMemo(() => {
    if (!debouncedSearch.trim()) return exams;
    const term = debouncedSearch.toLowerCase();
    return exams.filter((exam) => {
      const code = (exam.course?.code ?? exam.courseCode ?? "").toLowerCase();
      const name = (exam.course?.name ?? "").toLowerCase();
      return code.includes(term) || name.includes(term);
    });
  }, [exams, debouncedSearch]);

  const resetCreateForm = () => {
    createForm.reset(defaultFormValues);
    setCreateError("");
  };

  if (isStudent) {
    return (
      <ExamStudentView
        exams={exams}
        courses={courses}
        sessions={sessions}
        loading={loading}
        refetching={refetching}
        fetchError={fetchError}
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        sessionId={sessionId}
        onSessionChange={setSessionId}
        semester={semester}
        onSemesterChange={setSemester}
        studentLevelFilter={studentLevelFilter}
        onStudentLevelFilterChange={setStudentLevelFilter}
        onRetry={() => {
          setFiltersOpen(false);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Exams
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage and browse all exam schedule listings
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGenerateModalOpen(true)}
              className="rounded-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Auto-Generate
            </Button>
            <Button
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Exam
            </Button>
          </div>
        )}
      </div>

      <ExamFilters
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        sessionId={sessionId}
        onSessionChange={setSessionId}
        semester={semester}
        onSemesterChange={setSemester}
        sessions={sessions}
        filtersOpen={filtersOpen}
        onFiltersOpenChange={setFiltersOpen}
        limit={limit}
        onLimitChange={setLimit}
        onPageReset={() => setPage(1)}
      />

      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState
            entity="exams"
            onRetry={() => {
              setFiltersOpen(false);
              refetch();
            }}
          />
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  {[
                    "Date",
                    "Time",
                    "Course",
                    "Level",
                    "Venue",
                    "Students",
                    "College",
                    "Invigilators",
                  ].map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                  {isAdmin && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    {[90, 80, 140, 60, 70, 32, 60, 100].map((w, j) => (
                      <td key={j} className="p-3">
                        <div
                          className={`h-6 bg-gray-200 animate-pulse rounded w-[${w}px]`}
                        />
                      </td>
                    ))}
                    {isAdmin && (
                      <td className="p-3 text-right">
                        <div className="h-8 bg-gray-200 animate-pulse rounded w-16 ml-auto" />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="relative rounded-2xl border border-slate-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          <ClipboardList className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">
            No exams scheduled
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            Schedule exams for the active session.
          </p>
          {isAdmin && (
            <Button
              className="mt-5 bg-indigo-600 hover:bg-indigo-700"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Exam
            </Button>
          )}
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          <ExamTable
            exams={filteredExams}
            courses={courses}
            isAdmin={!!isAdmin}
            onEdit={(exam) => openEditExam(exam, editForm.reset, setEditExam)}
            onDelete={setDeleteExam}
          />
        </div>
      )}

      {total > 0 && (
        <Pagination
          page={page}
          totalPages={Math.max(1, totalPages)}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(v) => {
            setLimit(v);
            setPage(1);
          }}
          resultsLabel="exams"
        />
      )}

      <Dialog
        open={isCreateOpen}
        onOpenChange={(o) => {
          if (!o) {
            setIsCreateOpen(false);
            resetCreateForm();
          }
        }}
      >
        <DialogContent
          className="md:max-w-[560px]"
          onSwipeDown={() => {
            setIsCreateOpen(false);
            resetCreateForm();
          }}
        >
          <DialogHeader>
            <DialogTitle>Schedule Exam</DialogTitle>
            <DialogDescription>
              Select course, venue, date and time.
            </DialogDescription>
          </DialogHeader>
          <ExamForm
            form={createForm}
            courses={courses}
            submitting={creating}
            error={createError}
            submitLabel="Schedule Exam"
            onCancel={() => {
              setIsCreateOpen(false);
              resetCreateForm();
            }}
            onSubmit={createForm.handleSubmit((data) => {
              const selected =
                courses.find((c) => c.code === data.courseCode) ?? null;
              handleCreate(data, selected, () => {
                setIsCreateOpen(false);
                resetCreateForm();
              });
            })}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editExam}
        onOpenChange={(o) => {
          if (!o) {
            openForEditExamIdRef.current = null;
            setEditExam(null);
          }
        }}
      >
        <DialogContent
          className="md:max-w-[560px]"
          onSwipeDown={() => {
            openForEditExamIdRef.current = null;
            setEditExam(null);
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>Update exam details.</DialogDescription>
          </DialogHeader>
          <ExamForm
            form={editForm}
            courses={courses}
            submitting={editLoading}
            error={editError}
            submitLabel="Update Exam"
            onCancel={() => {
              openForEditExamIdRef.current = null;
              setEditExam(null);
            }}
            onSubmit={editForm.handleSubmit((data) => {
              if (!editExam) return;
              const selected =
                courses.find((c) => c.code === data.courseCode) ?? null;
              handleEditSubmit(editExam, data, selected, () => {
                openForEditExamIdRef.current = null;
                setEditExam(null);
              });
            })}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteExam}
        onOpenChange={(o) => !o && setDeleteExam(null)}
        title="Delete exam?"
        description={`This will permanently remove the exam for ${deleteExam?.courseCode ?? ""}.`}
        icon={Trash2}
        iconClassName="bg-red-500 text-white"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => handleDelete(deleteExam!, () => setDeleteExam(null))}
        loading={actionLoading}
      />
      <GenerateExamTimetableModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        onSuccess={refetch}
      />
    </div>
  );
}
