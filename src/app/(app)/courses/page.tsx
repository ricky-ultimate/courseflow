"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Download, Upload, Plus, Filter } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { AcademicSession, Course, Department, Level, Semester } from "@/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/state/error-state";
import { Pagination } from "@/components/ui/pagination";
import { CourseFilters, CourseFiltersMobileDialog } from "@/components/courses/course-filters";
import { CoursesTable } from "@/components/courses/courses-table";
import { CoursesMobileList } from "@/components/courses/courses-mobile-list";
import { CourseUploadModal } from "@/components/courses/course-upload-modal";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Button as Btn } from "@/components/ui/button";
import { ArrowLeft, Trash2 } from "lucide-react";
import { CourseDetailContent } from "@/components/courses/course-detail-content";

export default function CoursesPage() {
  const router = useRouter();
  const { isAdmin, isHod, user } = useAuth();
  const { toast } = useToast();

  const isStaff = isAdmin || isHod;
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const hasFetchedRef = useRef(false);
  usePageLoadReporter(loading);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [departmentCode, setDepartmentCode] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");
  const [semester, setSemester] = useState<string>("all");
  const [isGeneral, setIsGeneral] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(25);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const fetchDepts = async () => {
      const res = await apiClient.getDepartments({ limit: 100 });
      const r = getItemsFromResponse<Department>(res);
      if (r) setDepartments(r.items);
    };
    fetchDepts();
  }, []);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await apiClient.getAcademicSessions({ limit: 50 });
        const r = getItemsFromResponse<AcademicSession>(res);
        if (r) setSessions(r.items);
      } catch { }
    };
    fetchSessions();
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefetching(true);
      setFetchError(null);
      const params: Record<string, string | number | boolean> = {
        page, limit,
        ...(debouncedSearch && { searchTerm: debouncedSearch }),
        ...(departmentCode && departmentCode !== "all" && { departmentCode }),
        ...(level && level !== "all" && { level: level as Level }),
        ...(semester && semester !== "all" && { semester: semester as Semester }),
        ...(isGeneral && { isGeneral: true }),
      };
      const res = await apiClient.getCourses(params);
      const r = getItemsFromResponse<Course>(res);
      if (r) { setCourses(r.items); setTotalPages(r.totalPages); setTotal(r.total); }
    } catch {
      setFetchError("Failed to load courses");
      toast({ title: "Failed to load courses", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefetching(false);
      hasFetchedRef.current = true;
    }
  }, [page, limit, debouncedSearch, departmentCode, level, semester, isGeneral, toast]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  const filterCount = [departmentCode !== "all", level !== "all", semester !== "all", isGeneral].filter(Boolean).length;
  const hasFilters = filterCount > 0;

  const clearFilters = () => { setDepartmentCode("all"); setLevel("all"); setSemester("all"); setIsGeneral(false); setPage(1); };

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.getCoursesBulkTemplate();
      if (res.success && res.data) {
        const raw = res.data as unknown;
        const blob = raw instanceof Blob ? raw : new Blob([String(raw)], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "courses-template.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Template downloaded" });
      }
    } catch {
      toast({ title: "Failed to download template", variant: "destructive" });
    }
  };

  const openDetail = async (course: Course) => {
    setDetailCourse(course);
    setDetailLoading(true);
    try {
      const res = await apiClient.getCourseByCode(course.code);
      if (res.success && res.data) setDetailCourse(res.data as Course);
    } catch {
      toast({ title: "Failed to load course", variant: "destructive" });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (): Promise<boolean> => {
    if (!deleteCourse) return false;
    try {
      setDeleteLoading(true);
      const res = await apiClient.deleteCourse(deleteCourse.code);
      if (res.success) { toast({ title: `Course ${deleteCourse.code} deleted.` }); setDeleteCourse(null); fetchCourses(); return true; }
      toast({ title: (res as any).error, variant: "destructive" });
      return false;
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  const canEditCourse = (c: Course) => isAdmin || (isHod && user?.departmentCode === c.departmentCode);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Courses</h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage and browse all course listings</p>
        </div>
        <div className="flex items-center gap-2">
          {isStaff && (
            <>
              <Button variant="ghost" size="sm" className="rounded-full" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />Template
              </Button>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => setIsUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />Upload CSV
              </Button>
              <Button size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700" onClick={() => router.push("/courses/create")}>
                <Plus className="h-4 w-4 mr-2" />New Course
              </Button>
            </>
          )}
        </div>
      </div>

      <CourseFilters
        searchInput={searchInput} onSearchChange={setSearchInput}
        departmentCode={departmentCode} onDepartmentChange={setDepartmentCode}
        level={level} onLevelChange={setLevel}
        semester={semester} onSemesterChange={setSemester}
        isGeneral={isGeneral} onIsGeneralChange={setIsGeneral}
        departments={departments} filterCount={filterCount} hasFilters={hasFilters}
        onClearFilters={clearFilters} limit={limit} onLimitChange={(v) => { setLimit(v); setPage(1); }}
      />

      <div className="md:hidden">
        <Button variant="outline" className="rounded-full" onClick={() => setFiltersOpen(true)}>
          <Filter className="h-4 w-4 mr-2" />Filters {filterCount > 0 ? `(${filterCount})` : ""}
        </Button>
      </div>

      <CourseFiltersMobileDialog
        open={filtersOpen} onOpenChange={setFiltersOpen}
        departmentCode={departmentCode} onDepartmentChange={setDepartmentCode}
        level={level} onLevelChange={setLevel}
        semester={semester} onSemesterChange={setSemester}
        isGeneral={isGeneral} onIsGeneralChange={setIsGeneral}
        departments={departments} filterCount={filterCount}
        onClearFilters={clearFilters} limit={limit} onLimitChange={(v) => { setLimit(v); setPage(1); }}
      />

      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="courses" onRetry={() => { setFetchError(null); fetchCourses(); }} />
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  {["Code", "Name", "Level", "Semester", "Credits", "Department", "Lecturer", "Status", "Actions"].map((h) => (
                    <th key={h} className="p-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <tr key={i} className="border-t">
                    {[80, "3/4", 70, 100, 32, 60, 120, 60, 80].map((w, j) => (
                      <td key={j} className="p-3">
                        <div className={`h-6 bg-gray-200 animate-pulse rounded ${typeof w === "string" ? `w-${w}` : `w-[${w}px]`}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="relative rounded-2xl border border-slate-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No courses found</h3>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or add a new course.</p>
          {(isAdmin || isHod) && (
            <Button className="mt-5" onClick={() => router.push("/courses/create")}>
              <Plus className="h-4 w-4 mr-2" />+ New Course
            </Button>
          )}
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          <CoursesTable courses={courses} canEditCourse={canEditCourse} isAdmin={!!isAdmin} onView={openDetail} onDelete={setDeleteCourse} />
          <CoursesMobileList courses={courses} canEditCourse={canEditCourse} isAdmin={!!isAdmin} onView={openDetail} onDelete={setDeleteCourse} />
        </div>
      )}

      {total > 0 && (
        <Pagination page={page} totalPages={Math.max(1, totalPages)} total={total} limit={limit} onPageChange={setPage} onLimitChange={(v) => { setLimit(v); setPage(1); }} />
      )}

      <Sheet open={!!detailCourse} onOpenChange={(o) => !o && setDetailCourse(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto" hideCloseOnMobile>
          <SheetHeader className="md:sr-only">
            <Btn variant="ghost" size="icon" className="md:hidden absolute left-4 top-4 z-10" onClick={() => setDetailCourse(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Btn>
          </SheetHeader>
          {detailLoading ? (
            <div className="space-y-4 animate-pulse pt-12 md:pt-0">
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ) : detailCourse ? (
            <CourseDetailContent
              course={detailCourse}
              sessions={sessions}
              departments={departments}
              canEdit={canEditCourse(detailCourse)}
              canSchedule={!!isStaff && canEditCourse(detailCourse)}
              onClose={() => setDetailCourse(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <CourseUploadModal open={isUploadOpen} onOpenChange={setIsUploadOpen} onSuccess={fetchCourses} />

      <ConfirmDialog
        open={!!deleteCourse} onOpenChange={(o) => !o && setDeleteCourse(null)}
        title="Delete course?"
        description={`This will permanently delete ${deleteCourse?.code}. This action cannot be undone.`}
        icon={Trash2} iconClassName="bg-red-500 text-white"
        confirmLabel="Delete" confirmVariant="destructive"
        onConfirm={handleDelete} loading={deleteLoading}
      />
    </div>
  );
}
