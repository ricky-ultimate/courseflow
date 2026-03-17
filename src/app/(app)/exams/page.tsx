"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Exam, CreateExamData, UpdateExamData, Course, AcademicSession, Semester, VenueType, Level, ICT_VENUES } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ClipboardList, Filter, MoreVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/state/error-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { Pagination } from "@/components/ui/pagination";
import { ExamForm } from "@/components/exams/exam-form";
import { VENUE_LABELS, LEVEL_PILL } from "@/lib/constants";

const LEVEL_PILL_MAP: Record<string, string> = {
  [Level.LEVEL_100]: LEVEL_PILL[Level.LEVEL_100],
  [Level.LEVEL_200]: LEVEL_PILL[Level.LEVEL_200],
  [Level.LEVEL_300]: LEVEL_PILL[Level.LEVEL_300],
  [Level.LEVEL_400]: LEVEL_PILL[Level.LEVEL_400],
  [Level.LEVEL_500]: LEVEL_PILL[Level.LEVEL_500],
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function isCbtCourse(course: Course | null | undefined): boolean {
  if (!course) return false;
  return course.level === Level.LEVEL_100 || !!course.isGeneral;
}

function createExamSchema(courses: Course[]) {
  return z.object({
    courseCode: z.string().min(1, "Course is required"),
    venue: z.nativeEnum(VenueType),
    date: z.string().min(1, "Date is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    studentCount: z.union([z.number(), z.string()]).transform((v) => { const n = typeof v === "string" ? parseInt(v, 10) : v; return isNaN(n as number) ? 1 : (n as number); }).pipe(z.number().min(1)),
    invigilators: z.string().optional(),
    targetCollege: z.string().optional(),
  }).refine((d) => {
    const [sh, sm] = d.startTime.split(":").map(Number);
    const [eh, em] = d.endTime.split(":").map(Number);
    return (eh ?? 0) * 60 + ((em ?? 0)) > (sh ?? 0) * 60 + ((sm ?? 0));
  }, { message: "End time must be after start time", path: ["endTime"] }).superRefine((data, ctx) => {
    const course = courses.find((c) => c.code === data.courseCode);
    if (course && isCbtCourse(course) && !ICT_VENUES.includes(data.venue as VenueType)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "CBT courses require an ICT venue", path: ["venue"] });
    }
    if (course?.isGeneral && !data.targetCollege) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "General courses require Target College", path: ["targetCollege"] });
    }
  });
}

export default function ExamsPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [exams, setExams] = useState<Exam[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const hasFetchedRef = useRef(false);
  usePageLoadReporter(loading);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sessionId, setSessionId] = useState<string>("");
  const [semester, setSemester] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [editExam, setEditExam] = useState<Exam | null>(null);
  const openForEditExamIdRef = useRef<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [deleteExam, setDeleteExam] = useState<Exam | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const examSchema = useMemo(() => createExamSchema(courses), [courses]);
  type ExamFormValues = z.infer<ReturnType<typeof createExamSchema>>;

  const form = useForm<ExamFormValues>({ resolver: zodResolver(examSchema), mode: "onBlur", defaultValues: { courseCode: "", venue: VenueType.LECTURE_HALL_1, date: "", startTime: "", endTime: "", studentCount: 1, invigilators: "", targetCollege: undefined } });
  const editForm = useForm<ExamFormValues>({ resolver: zodResolver(examSchema), mode: "onBlur", defaultValues: { courseCode: "", venue: VenueType.LECTURE_HALL_1, date: "", startTime: "", endTime: "", studentCount: 1, invigilators: "", targetCollege: undefined } });

  useEffect(() => { const t = setTimeout(() => { setDebouncedSearch(searchInput); setPage(1); }, 300); return () => clearTimeout(t); }, [searchInput]);

  const openEditExam = useCallback(async (exam: Exam) => {
    openForEditExamIdRef.current = exam.id;
    setEditExam(exam);
    setEditError("");
    const resetValues = { courseCode: exam.courseCode, venue: exam.venue ?? VenueType.LECTURE_HALL_1, date: exam.date?.includes("T") ? exam.date.split("T")[0]! : (exam.date ?? ""), startTime: exam.startTime ?? "", endTime: exam.endTime ?? "", studentCount: exam.studentCount ?? 1, invigilators: exam.invigilators ?? "", targetCollege: exam.targetCollege ?? undefined };
    editForm.reset(resetValues);
    try {
      const res = await apiClient.getExamById(exam.id);
      if (openForEditExamIdRef.current !== exam.id) return;
      if (res.success && res.data) {
        const fresh = res.data as Exam;
        setEditExam(fresh);
        editForm.reset({ courseCode: fresh.courseCode, venue: fresh.venue ?? VenueType.LECTURE_HALL_1, date: fresh.date?.includes("T") ? fresh.date.split("T")[0]! : (fresh.date ?? ""), startTime: fresh.startTime ?? "", endTime: fresh.endTime ?? "", studentCount: fresh.studentCount ?? 1, invigilators: fresh.invigilators ?? "", targetCollege: fresh.targetCollege ?? undefined });
      }
    } catch {
      if (openForEditExamIdRef.current === exam.id) toast({ title: "Failed to load exam", variant: "destructive" });
    }
  }, [editForm, toast]);

  const fetchData = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefetching(true);
      setFetchError(null);
      const params: Record<string, unknown> = { page, limit };
      if (sessionId) params.sessionId = sessionId;
      if (semester && semester !== "all") params.semester = semester;
      const [examsRes, coursesRes, sessRes] = await Promise.all([apiClient.getExams(params), apiClient.getCourses({ limit: 500 }), apiClient.getAcademicSessions({ limit: 50 })]);
      const examR = getItemsFromResponse<Exam>(examsRes);
      const courseR = getItemsFromResponse<Course>(coursesRes);
      const sessR = getItemsFromResponse<AcademicSession>(sessRes);
      if (examR) { setExams(examR.items); setTotal(examR.total); setTotalPages(examR.totalPages); }
      if (courseR) setCourses(courseR.items);
      if (sessR) setSessions(sessR.items);
      if (sessR?.items?.length && !sessionId) setSessionId(sessR.items[0]!.id);
    } catch {
      setFetchError("Failed to load exams");
      toast({ title: "Failed to load exams", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefetching(false);
      hasFetchedRef.current = true;
    }
  }, [sessionId, semester, page, limit, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredExams = debouncedSearch.trim()
    ? exams.filter((exam) => { const term = debouncedSearch.toLowerCase(); const code = (exam.course?.code ?? exam.courseCode ?? "").toLowerCase(); const name = (exam.course?.name ?? "").toLowerCase(); return code.includes(term) || name.includes(term); })
    : exams;

  const resetCreateForm = () => { form.reset({ courseCode: "", venue: VenueType.LECTURE_HALL_1, date: "", startTime: "", endTime: "", studentCount: 1, invigilators: "", targetCollege: undefined }); setCreateError(""); };

  const handleCreate = form.handleSubmit(async (data) => {
    setCreateError("");
    try {
      setCreating(true);
      const selectedCourse = courses.find((c) => c.code === data.courseCode) ?? null;
      const payload: CreateExamData = { courseCode: data.courseCode, venue: data.venue as VenueType, date: data.date.includes("T") ? data.date : `${data.date}T00:00:00.000Z`, startTime: data.startTime, endTime: data.endTime, studentCount: typeof data.studentCount === "number" ? data.studentCount : parseInt(String(data.studentCount), 10) || 1, invigilators: data.invigilators, targetCollege: selectedCourse?.isGeneral ? (data.targetCollege as any) : undefined };
      const res = await apiClient.createExam(payload);
      if (res.success) { toast({ title: `Exam scheduled for ${data.courseCode}.` }); setIsCreateOpen(false); resetCreateForm(); setPage(1); fetchData(); }
      else setCreateError((res as { error?: string }).error ?? "Failed to schedule");
    } catch { setCreateError("Failed to schedule exam"); }
    finally { setCreating(false); }
  });

  const handleEditSubmit = editForm.handleSubmit(async (data) => {
    if (!editExam) return;
    setEditError("");
    try {
      setEditLoading(true);
      const editSelectedCourse = courses.find((c) => c.code === data.courseCode) ?? null;
      const payload: UpdateExamData = { courseCode: data.courseCode, venue: data.venue as VenueType, date: data.date.includes("T") ? data.date : `${data.date}T00:00:00.000Z`, startTime: data.startTime, endTime: data.endTime, studentCount: typeof data.studentCount === "number" ? data.studentCount : parseInt(String(data.studentCount), 10) || 1, invigilators: data.invigilators, targetCollege: editSelectedCourse?.isGeneral ? (data.targetCollege as any) : undefined };
      const res = await apiClient.updateExam(editExam.id, payload);
      if (res.success) { toast({ title: "Exam updated." }); setEditExam(null); fetchData(); }
      else setEditError((res as { error?: string }).error ?? "Failed to update");
    } catch { setEditError("Failed to update exam"); }
    finally { setEditLoading(false); }
  });

  const handleDelete = async (): Promise<boolean> => {
    if (!deleteExam) return false;
    try {
      setActionLoading(true);
      const res = await apiClient.deleteExam(deleteExam.id);
      if (res.success) { toast({ title: "Exam deleted." }); setDeleteExam(null); if (exams.length === 1 && page > 1) setPage((p) => p - 1); else fetchData(); return true; }
      toast({ title: (res as any).error, variant: "destructive" });
      return false;
    } catch { toast({ title: "Delete failed", variant: "destructive" }); return false; }
    finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Exams</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage and browse all exam schedule listings</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 rounded-full">
            <Plus className="h-4 w-4 mr-2" />Schedule Exam
          </Button>
        )}
      </div>

      <FilterBar searchValue={searchInput} onSearchChange={setSearchInput} searchPlaceholder="Search by course code or name...">
        <div className="hidden md:flex items-center gap-1">
          <FilterSelect value={sessionId || "all"} onValueChange={(v) => { setSessionId(v === "all" ? "" : v); setPage(1); }} width="w-[160px]">
            <SelectItem value="all">All Sessions</SelectItem>
            {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </FilterSelect>
          <FilterSelect value={semester} onValueChange={(v) => { setSemester(v); setPage(1); }} width="w-[150px]">
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
            <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
          </FilterSelect>
        </div>
        <Button variant="outline" className="md:hidden rounded-full" onClick={() => setFiltersOpen(true)}>
          <Filter className="h-4 w-4 mr-2" />Filters
        </Button>
      </FilterBar>

      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="md:max-w-[400px]" onSwipeDown={() => setFiltersOpen(false)}>
          <DialogHeader><DialogTitle>Filters</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Session</Label>
              <Select value={sessionId || "all"} onValueChange={(v) => { setSessionId(v === "all" ? "" : v); setPage(1); }}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {sessions.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Semester</Label>
              <Select value={semester} onValueChange={(v) => { setSemester(v); setPage(1); }}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                  <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Per page</Label>
              <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); setFiltersOpen(false); }}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>Apply</Button>
          </div>
        </DialogContent>
      </Dialog>

      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6"><ErrorState entity="exams" onRetry={() => { setFetchError(null); fetchData(); }} /></div>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  {["Date","Time","Course","Level","Venue","Students","College","Invigilators"].map((h) => <th key={h} className="p-3">{h}</th>)}
                  {isAdmin && <th className="p-3 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, i) => (
                  <tr key={i} className="border-t">
                    {[90,80,140,60,70,32,60,100].map((w, j) => <td key={j} className="p-3"><div className={`h-6 bg-gray-200 animate-pulse rounded w-[${w}px]`} /></td>)}
                    {isAdmin && <td className="p-3 text-right"><div className="h-8 bg-gray-200 animate-pulse rounded w-16 ml-auto" /></td>}
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
          <h3 className="text-base font-semibold text-gray-700">No exams scheduled</h3>
          <p className="text-sm text-gray-400 mt-2">Schedule exams for the active session.</p>
          {isAdmin && <Button className="mt-5 bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Schedule Exam</Button>}
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b sticky top-0 z-10">
                  <tr className="text-left text-sm text-gray-500">
                    {["Date","Time","Course","Level","Venue","Students","College","Invigilators"].map((h) => <th key={h} className="p-3">{h}</th>)}
                    {isAdmin && <th className="p-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredExams.map((exam) => {
                    const course = exam.course ?? courses.find((c) => c.code === exam.courseCode);
                    const cbt = isCbtCourse(course);
                    return (
                      <tr key={exam.id} className="border-t hover:bg-gray-50">
                        <td className="p-3 text-sm">{formatDate(exam.date)}</td>
                        <td className="p-3 text-sm">{exam.startTime} – {exam.endTime}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{exam.courseCode}</span>
                            {cbt && <Badge className="bg-indigo-100 text-indigo-700 text-xs">CBT</Badge>}
                            <span className="text-sm">{course?.name ?? ""}</span>
                          </div>
                        </td>
                        <td className="p-3"><Badge variant="secondary" className={LEVEL_PILL_MAP[course?.level ?? ""] ?? "bg-gray-100"}>{course?.level?.replace("LEVEL_", "") ?? "—"}</Badge></td>
                        <td className="p-3 text-sm">{VENUE_LABELS[exam.venue] ?? exam.venue}</td>
                        <td className="p-3 text-sm">{exam.studentCount}</td>
                        <td className="p-3">{exam.targetCollege ? <Badge variant="outline" className="text-xs">{exam.targetCollege}</Badge> : <span className="text-gray-400">—</span>}</td>
                        <td className="p-3 text-sm truncate max-w-[120px]" title={exam.invigilators ?? ""}>{exam.invigilators ?? "—"}</td>
                        {isAdmin && (
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => openEditExam(exam)}><Pencil className="h-5 w-5" /></Button>
                              <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600" onClick={() => setDeleteExam(exam)}><Trash2 className="h-5 w-5" /></Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          <div className="md:hidden space-y-3">
            {filteredExams.map((exam) => {
              const course = exam.course ?? courses.find((c) => c.code === exam.courseCode);
              const cbt = isCbtCourse(course);
              return (
                <div key={exam.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium">{formatDate(exam.date)} {exam.startTime}–{exam.endTime}</p>
                    {cbt && <Badge className="bg-indigo-100 text-indigo-700 text-xs shrink-0">CBT</Badge>}
                  </div>
                  <p className="text-sm font-semibold mt-2">{exam.courseCode} · {course?.name ?? ""}</p>
                  <p className="text-sm text-gray-500">{VENUE_LABELS[exam.venue] ?? exam.venue}</p>
                  <p className="text-xs text-gray-500">{exam.studentCount} students · {exam.targetCollege ?? "—"}</p>
                  <div className="border-t mt-3 pt-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate flex-1 min-w-0">{exam.invigilators ?? "—"}</p>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-11 w-11 shrink-0"><MoreVertical className="h-5 w-5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditExam(exam)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => setDeleteExam(exam)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {total > 0 && <Pagination page={page} totalPages={Math.max(1, totalPages)} total={total} limit={limit} onPageChange={setPage} onLimitChange={(v) => { setLimit(v); setPage(1); }} resultsLabel="exams" />}

      <Dialog open={isCreateOpen} onOpenChange={(o) => { if (!o) { setIsCreateOpen(false); resetCreateForm(); } }}>
        <DialogContent className="md:max-w-[560px]" onSwipeDown={() => { setIsCreateOpen(false); resetCreateForm(); }}>
          <DialogHeader>
            <DialogTitle>Schedule Exam</DialogTitle>
            <DialogDescription>Select course, venue, date and time.</DialogDescription>
          </DialogHeader>
          <ExamForm form={form} courses={courses} submitting={creating} error={createError} submitLabel="Schedule Exam" onCancel={() => { setIsCreateOpen(false); resetCreateForm(); }} onSubmit={handleCreate} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editExam} onOpenChange={(o) => { if (!o) { openForEditExamIdRef.current = null; setEditExam(null); } }}>
        <DialogContent className="md:max-w-[560px]" onSwipeDown={() => { openForEditExamIdRef.current = null; setEditExam(null); }}>
          <DialogHeader>
            <DialogTitle>Edit Exam</DialogTitle>
            <DialogDescription>Update exam details.</DialogDescription>
          </DialogHeader>
          <ExamForm form={editForm} courses={courses} submitting={editLoading} error={editError} submitLabel="Update Exam" onCancel={() => { openForEditExamIdRef.current = null; setEditExam(null); }} onSubmit={handleEditSubmit} />
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteExam} onOpenChange={(o) => !o && setDeleteExam(null)} title="Delete exam?" description={`This will permanently remove the exam for ${deleteExam?.courseCode ?? ""}.`} icon={Trash2} iconClassName="bg-red-500 text-white" confirmLabel="Delete" confirmVariant="destructive" onConfirm={handleDelete} loading={actionLoading} />
    </div>
  );
}
