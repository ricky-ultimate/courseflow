"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import {
  Exam,
  Course,
  AcademicSession,
  CreateExamData,
  UpdateExamData,
  VenueType,
} from "@/types";

interface UseExamsOptions {
  sessionId: string;
  semester: string;
  page: number;
  limit: number;
  isStudent: boolean;
  departmentCode?: string | null;
}

export function useExams({
  sessionId,
  semester,
  page,
  limit,
  isStudent,
  departmentCode,
}: UseExamsOptions) {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const hasFetchedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefetching(true);
      setFetchError(null);

      const params: Record<string, unknown> = { page, limit };
      if (sessionId) params.sessionId = sessionId;
      if (semester && semester !== "all") params.semester = semester;
      if (isStudent && departmentCode)
        params.departmentCode = departmentCode;

      const [examsRes, coursesRes, sessRes] = await Promise.all([
        apiClient.getExams(params),
        apiClient.getCourses({ limit: 500 }),
        apiClient.getAcademicSessions({ limit: 50 }),
      ]);

      const examR = getItemsFromResponse<Exam>(examsRes);
      const courseR = getItemsFromResponse<Course>(coursesRes);
      const sessR = getItemsFromResponse<AcademicSession>(sessRes);

      if (examR) {
        setExams(examR.items);
        setTotal(examR.total);
        setTotalPages(examR.totalPages);
      }
      if (courseR) setCourses(courseR.items);
      if (sessR) setSessions(sessR.items);
    } catch {
      setFetchError("Failed to load exams");
      toast({ title: "Failed to load exams", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefetching(false);
      hasFetchedRef.current = true;
    }
  }, [sessionId, semester, page, limit, isStudent, departmentCode, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    exams,
    courses,
    sessions,
    loading,
    refetching,
    total,
    totalPages,
    fetchError,
    refetch: fetchData,
  };
}

export function useExamMutations(
  refetch: () => void,
  exams: Exam[],
  page: number,
  onPageChange: (p: number) => void
) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const openForEditExamIdRef = useRef<string | null>(null);

  const openEditExam = useCallback(
    async (
      exam: Exam,
      resetForm: (values: any) => void,
      setEditExam: (e: Exam) => void
    ) => {
      openForEditExamIdRef.current = exam.id;
      setEditExam(exam);
      setEditError("");
      const base = {
        courseCode: exam.courseCode,
        venue: exam.venue ?? VenueType.LECTURE_HALL_1,
        date: exam.date?.includes("T")
          ? exam.date.split("T")[0]!
          : (exam.date ?? ""),
        startTime: exam.startTime ?? "",
        endTime: exam.endTime ?? "",
        studentCount: exam.studentCount ?? 1,
        invigilators: exam.invigilators ?? "",
        targetCollege: exam.targetCollege ?? undefined,
      };
      resetForm(base);
      try {
        const res = await apiClient.getExamById(exam.id);
        if (openForEditExamIdRef.current !== exam.id) return;
        if (res.success && res.data) {
          const fresh = res.data as Exam;
          setEditExam(fresh);
          resetForm({
            courseCode: fresh.courseCode,
            venue: fresh.venue ?? VenueType.LECTURE_HALL_1,
            date: fresh.date?.includes("T")
              ? fresh.date.split("T")[0]!
              : (fresh.date ?? ""),
            startTime: fresh.startTime ?? "",
            endTime: fresh.endTime ?? "",
            studentCount: fresh.studentCount ?? 1,
            invigilators: fresh.invigilators ?? "",
            targetCollege: fresh.targetCollege ?? undefined,
          });
        }
      } catch {
        if (openForEditExamIdRef.current === exam.id)
          toast({ title: "Failed to load exam", variant: "destructive" });
      }
    },
    [toast]
  );

  const handleCreate = useCallback(
    async (
      data: any,
      selectedCourse: Course | null,
      onSuccess: () => void
    ) => {
      setCreateError("");
      try {
        setCreating(true);
        const payload: CreateExamData = {
          courseCode: data.courseCode,
          venue: data.venue as VenueType,
          date: data.date.includes("T")
            ? data.date
            : `${data.date}T00:00:00.000Z`,
          startTime: data.startTime,
          endTime: data.endTime,
          studentCount:
            typeof data.studentCount === "number"
              ? data.studentCount
              : parseInt(String(data.studentCount), 10) || 1,
          invigilators: data.invigilators,
          targetCollege: selectedCourse?.isGeneral
            ? data.targetCollege
            : undefined,
        };
        const res = await apiClient.createExam(payload);
        if (res.success) {
          toast({ title: `Exam scheduled for ${data.courseCode}.` });
          onSuccess();
          refetch();
        } else {
          setCreateError(
            (res as { error?: string }).error ?? "Failed to schedule"
          );
        }
      } catch {
        setCreateError("Failed to schedule exam");
      } finally {
        setCreating(false);
      }
    },
    [toast, refetch]
  );

  const handleEditSubmit = useCallback(
    async (
      editExam: Exam,
      data: any,
      editSelectedCourse: Course | null,
      onSuccess: () => void
    ) => {
      setEditError("");
      try {
        setEditLoading(true);
        const payload: UpdateExamData = {
          courseCode: data.courseCode,
          venue: data.venue as VenueType,
          date: data.date.includes("T")
            ? data.date
            : `${data.date}T00:00:00.000Z`,
          startTime: data.startTime,
          endTime: data.endTime,
          studentCount:
            typeof data.studentCount === "number"
              ? data.studentCount
              : parseInt(String(data.studentCount), 10) || 1,
          invigilators: data.invigilators,
          targetCollege: editSelectedCourse?.isGeneral
            ? data.targetCollege
            : undefined,
        };
        const res = await apiClient.updateExam(editExam.id, payload);
        if (res.success) {
          toast({ title: "Exam updated." });
          onSuccess();
          refetch();
        } else {
          setEditError(
            (res as { error?: string }).error ?? "Failed to update"
          );
        }
      } catch {
        setEditError("Failed to update exam");
      } finally {
        setEditLoading(false);
      }
    },
    [toast, refetch]
  );

  const handleDelete = useCallback(
    async (deleteExam: Exam, onSuccess: () => void): Promise<boolean> => {
      try {
        setActionLoading(true);
        const res = await apiClient.deleteExam(deleteExam.id);
        if (res.success) {
          toast({ title: "Exam deleted." });
          onSuccess();
          if (exams.length === 1 && page > 1) onPageChange(page - 1);
          else refetch();
          return true;
        }
        toast({ title: (res as any).error, variant: "destructive" });
        return false;
      } catch {
        toast({ title: "Delete failed", variant: "destructive" });
        return false;
      } finally {
        setActionLoading(false);
      }
    },
    [toast, refetch, exams.length, page, onPageChange]
  );

  return {
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
  };
}
