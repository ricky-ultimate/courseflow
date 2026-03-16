"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { useToast } from "@/hooks/use-toast";
import {
  BookOpen,
  Search,
  Filter,
  Upload,
  Download,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Lock,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { AcademicSession, Course, Department, Level, Semester } from "@/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/state/error-state";
import { Pagination } from "@/components/ui/pagination";

const LEVEL_PILL: Record<Level, string> = {
  [Level.LEVEL_100]: "bg-slate-100 text-slate-700",
  [Level.LEVEL_200]: "bg-blue-100 text-blue-700",
  [Level.LEVEL_300]: "bg-violet-100 text-violet-700",
  [Level.LEVEL_400]: "bg-orange-100 text-orange-700",
  [Level.LEVEL_500]: "bg-red-100 text-red-700",
};

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

export default function CoursesPage() {
  const router = useRouter();
  const { isAdmin, isHod, user } = useAuth();
  const { toast } = useToast();

  const isStaff = isAdmin || isHod;
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [mobileCourseMenu, setMobileCourseMenu] = useState<Course | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);

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
      } catch { /* ignore */ }
    };
    fetchSessions();
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefetching(true);
      setFetchError(null);
      const params: Record<string, string | number | boolean> = {
        page,
        limit,
        ...(debouncedSearch && { searchTerm: debouncedSearch }),
        ...(departmentCode && departmentCode !== "all" && { departmentCode }),
        ...(level && level !== "all" && { level: level as Level }),
        ...(semester && semester !== "all" && { semester: semester as Semester }),
        ...(isGeneral && { isGeneral: true }),
      };
      const res = await apiClient.getCourses(params);
      const r = getItemsFromResponse<Course>(res);
      if (r) {
        setCourses(r.items);
        setTotalPages(r.totalPages);
        setTotal(r.total);
      }
    } catch {
      setFetchError("Failed to load courses");
      toast({ title: "Failed to load courses", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefetching(false);
      hasFetchedRef.current = true;
    }
  }, [page, limit, debouncedSearch, departmentCode, level, semester, isGeneral, toast]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const filterCount = [departmentCode !== "all", level !== "all", semester !== "all", isGeneral].filter(Boolean).length;
  const hasFilters = filterCount > 0;

  const clearFilters = () => {
    setDepartmentCode("all");
    setLevel("all");
    setSemester("all");
    setIsGeneral(false);
    setPage(1);
  };

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

  const handleBulkUpload = async () => {
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      const res = await apiClient.uploadCoursesBulk(selectedFile);
      if (res.success) {
        toast({ title: "Courses uploaded successfully." });
        setIsUploadOpen(false);
        setSelectedFile(null);
        fetchCourses();
      } else {
        toast({ title: (res as any).error || "Upload failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
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
      if (res.success) {
        toast({ title: `Course ${deleteCourse.code} deleted.` });
        setDeleteCourse(null);
        fetchCourses();
        return true;
      }
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
      {/* 7.1 Page header — filter bar margin-top 16px, courses margin-top 16px */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Courses</h1>
        <div className="flex items-center gap-2">
          {isStaff && (
            <>
              <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => setIsUploadOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
              <Button size="sm" onClick={() => router.push("/courses/create")}>
                <Plus className="h-4 w-4 mr-2" />
                New Course
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 7.2 Filter bar — desktop: padding 12px 20px, mobile: search + Filters (N) on same row */}
      <div className="rounded-xl border border-gray-200 bg-white py-3 px-5">
        <div className="flex flex-row flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-0 md:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by code, name or lecturer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <Select value={departmentCode} onValueChange={setDepartmentCode}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={level} onValueChange={setLevel}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="All Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                {[Level.LEVEL_100, Level.LEVEL_200, Level.LEVEL_300, Level.LEVEL_400, Level.LEVEL_500].map((l) => (
                  <SelectItem key={l} value={l}>{l.replace("LEVEL_", "")} Level</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="All Semesters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
              </SelectContent>
            </Select>
            {departmentCode === "all" && (
              <Button
                variant={isGeneral ? "default" : "outline"}
                size="sm"
                onClick={() => setIsGeneral(!isGeneral)}
              >
                General Only
              </Button>
            )}
            {hasFilters && (
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            )}
          </div>
          <Button variant="outline" className="md:hidden shrink-0" onClick={() => setFiltersOpen(true)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters {filterCount > 0 ? `(${filterCount})` : ""}
          </Button>
        </div>
      </div>

      {/* Mobile filters */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="md:max-w-[400px]" onSwipeDown={() => setFiltersOpen(false)}>
          <DialogHeader><DialogTitle>Filters</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Department</label>
              <Select value={departmentCode} onValueChange={setDepartmentCode}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((d) => (
                    <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Level</label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  {[Level.LEVEL_100, Level.LEVEL_200, Level.LEVEL_300, Level.LEVEL_400, Level.LEVEL_500].map((l) => (
                    <SelectItem key={l} value={l}>{l.replace("LEVEL_", "")} Level</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Semester</label>
              <Select value={semester} onValueChange={setSemester}>
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
                <Button variant={isGeneral ? "default" : "outline"} className="w-full mt-1.5" onClick={() => setIsGeneral(!isGeneral)}>{isGeneral ? "On" : "Off"}</Button>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">Per page</label>
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
            <button type="button" className="text-sm text-gray-500 underline" onClick={() => { clearFilters(); setFiltersOpen(false); }}>Clear All</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 7.3 Courses table / card list */}
      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="courses" onRetry={() => { setFetchError(null); fetchCourses(); }} />
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  <th className="p-3 w-[100px]">Code</th>
                  <th className="p-3">Name</th>
                  <th className="p-3 w-[100px]">Level</th>
                  <th className="p-3 w-[150px] hidden lg:table-cell">Semester</th>
                  <th className="p-3 w-[70px] hidden lg:table-cell text-center">Credits</th>
                  <th className="p-3 w-[90px]">Department</th>
                  <th className="p-3 w-[160px]">Lecturer</th>
                  <th className="p-3 w-[80px] hidden lg:table-cell">Status</th>
                  <th className="p-3 w-[80px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[80px]" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-3/4" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[70px]" /></td>
                    <td className="p-3 hidden lg:table-cell"><div className="h-6 bg-gray-200 animate-pulse rounded w-[100px]" /></td>
                    <td className="p-3 hidden lg:table-cell"><div className="h-6 bg-gray-200 animate-pulse rounded w-8 mx-auto" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[60px]" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-[120px]" /></td>
                    <td className="p-3 hidden lg:table-cell"><div className="h-6 bg-gray-200 animate-pulse rounded w-[60px]" /></td>
                    <td className="p-3 text-right"><div className="h-8 bg-gray-200 animate-pulse rounded w-16 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="relative rounded-xl border border-gray-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No courses found</h3>
          <p className="text-sm text-gray-400 mt-2">Try adjusting your filters or add a new course.</p>
          {(isAdmin || isHod) && (
            <Button className="mt-5" onClick={() => router.push("/courses/create")}>
              <Plus className="h-4 w-4 mr-2" />
              + New Course
            </Button>
          )}
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b sticky top-0 z-10">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-3 w-[100px]">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3 w-[100px]">Level</th>
                    <th className="p-3 w-[80px] hidden lg:table-cell">Semester</th>
                    <th className="p-3 w-[70px] hidden lg:table-cell text-center">Credits</th>
                    <th className="p-3 w-[90px]">Department</th>
                    <th className="p-3 w-[160px]">Lecturer</th>
                    <th className="p-3 w-[80px] hidden lg:table-cell">Status</th>
                    <th className="p-3 w-[80px] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{c.code}</span>
                      </td>
                      <td className="p-3 text-sm">{c.name}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className={LEVEL_PILL[c.level] ?? ""}>{c.level.replace("LEVEL_", "")}</Badge>
                      </td>
                      <td className="p-3 text-sm hidden lg:table-cell">{c.semester === Semester.FIRST ? "First" : "Second"}</td>
                      <td className="p-3 text-center text-sm hidden lg:table-cell">{c.credits}</td>
                      <td className="p-3">
                        <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded">{c.departmentCode}</span>
                      </td>
                      <td className="p-3 text-sm">
                        {c.lecturer ? c.lecturer.name ?? c.lecturer.email : <span className="italic text-gray-400">Unassigned</span>}
                      </td>
                      <td className="p-3 hidden lg:table-cell">
                        {c.isLocked ? (
                          <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Lock className="h-3 w-3 mr-1 inline" />Locked</Badge>
                        ) : c.isActive ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inactive</Badge>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1 min-w-0">
                          <Button size="icon" variant="ghost" className="h-11 w-11 touch-manipulation" onClick={() => openDetail(c)}><Eye className="h-5 w-5" /><span className="sr-only">View</span></Button>
                          {canEditCourse(c) && (
                            <Button size="icon" variant="ghost" className="h-11 w-11 touch-manipulation" onClick={() => router.push(`/courses/${c.code}/edit`)}><Pencil className="h-5 w-5" /><span className="sr-only">Edit</span></Button>
                          )}
                          {isAdmin && (
                            <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600 touch-manipulation" onClick={() => setDeleteCourse(c)}><Trash2 className="h-5 w-5" /><span className="sr-only">Delete</span></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards — §7.3 layout: Code|Level, Name, Lecturer·Dept, Semester·Credits, divider, Status|[···] */}
          <div className="md:hidden space-y-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                onClick={(e) => { if (!(e.target as HTMLElement).closest('[data-menu]')) openDetail(c); }}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-mono text-sm font-semibold">{c.code}</p>
                  <Badge variant="secondary" className={LEVEL_PILL[c.level] ?? ""}>{c.level.replace("LEVEL_", "")}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{c.name}</p>
                <p className="text-xs text-gray-500 mt-1">{c.lecturer?.name ?? "Unassigned"} · {c.department?.name ?? c.departmentCode}</p>
                <p className="text-xs text-gray-500">{c.semester === Semester.FIRST ? "First" : "Second"} Semester · {c.credits} Credits</p>
                <div className="mt-3 pt-3 border-t flex justify-between items-center">
                  {c.isLocked ? (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700"><Lock className="h-3 w-3 mr-1" />Locked</Badge>
                  ) : c.isActive ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-700">Active</Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">Inactive</Badge>
                  )}
                  <div data-menu>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-11 w-11 touch-manipulation"
                      onClick={(e) => { e.stopPropagation(); setMobileCourseMenu(c); }}
                    >
                      <MoreVertical className="h-5 w-5" />
                      <span className="sr-only">Menu</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile course action bottom sheet */}
          <Sheet open={!!mobileCourseMenu} onOpenChange={(o) => !o && setMobileCourseMenu(null)}>
            <SheetContent side="bottom" className="rounded-t-2xl">
              <SheetHeader>
                <SheetTitle>{mobileCourseMenu?.name ?? 'Course actions'}</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 py-4">
                {mobileCourseMenu && (() => {
                  const course = mobileCourseMenu
                  const close = () => setMobileCourseMenu(null)
                  return (
                    <>
                      <button
                        type="button"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                        onClick={() => { openDetail(course); close(); }}
                      >
                        View Details
                      </button>
                      {canEditCourse(course) && (
                        <button
                          type="button"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                          onClick={() => { router.push(`/courses/${course.code}/edit`); close(); }}
                        >
                          Edit Course
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          type="button"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-left w-full min-h-[52px] font-medium"
                          onClick={() => { setDeleteCourse(course); close(); }}
                        >
                          Delete Course
                        </button>
                      )}
                    </>
                  )
                })()}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Pagination — §17 */}
      {total > 0 && (
        <Pagination
          page={page}
          totalPages={Math.max(1, totalPages)}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(v) => { setLimit(v); setPage(1); }}
        />
      )}

      {/* 7.4 Course Detail Sheet */}
      <Sheet open={!!detailCourse} onOpenChange={(o) => !o && setDetailCourse(null)}>
        <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto" hideCloseOnMobile>
          <SheetHeader className="md:sr-only">
            <Button variant="ghost" size="icon" className="md:hidden absolute left-4 top-4 z-10" onClick={() => setDetailCourse(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </SheetHeader>
          {detailLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/2" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          ) : detailCourse ? (
            <div className="pt-12 md:pt-0 space-y-6">
              <div>
                <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{detailCourse.code}</span>
                <h2 className="text-xl font-semibold mt-2">{detailCourse.name}</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <p><span className="text-gray-500">Level</span><br />{detailCourse.level.replace("LEVEL_", "")}</p>
                <p><span className="text-gray-500">Semester</span><br />{detailCourse.semester === Semester.FIRST ? "First" : "Second"}</p>
                <p><span className="text-gray-500">Credits</span><br />{detailCourse.credits}</p>
                <p><span className="text-gray-500">Department</span><br />{detailCourse.department?.name ?? detailCourse.departmentCode}</p>
                <p><span className="text-gray-500">Session</span><br />{detailCourse.schedules?.[0]?.sessionId ? (sessions.find(s => s.id === detailCourse.schedules?.[0]?.sessionId)?.name ?? detailCourse.schedules[0].sessionId) : "—"}</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {detailCourse.isActive ? <Badge className="bg-green-100 text-green-700">Active</Badge> : <Badge variant="secondary">Inactive</Badge>}
                {detailCourse.isGeneral ? <Badge variant="secondary">General</Badge> : <Badge variant="secondary">Specific</Badge>}
                {detailCourse.isLocked ? <Badge className="bg-amber-100 text-amber-700"><Lock className="h-3 w-3 mr-1" />Locked</Badge> : <Badge variant="outline">Unlocked</Badge>}
              </div>
              <div>
                <h3 className="font-medium mb-2">Overview</h3>
                <p className="text-sm text-gray-600">{detailCourse.overview || <span className="italic text-gray-400">No overview provided.</span>}</p>
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Lecturer</h3>
                {detailCourse.lecturer ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-medium text-indigo-700">
                        {getInitials(detailCourse.lecturer.name)}
                      </div>
                      <div>
                        <p className="font-medium">{detailCourse.lecturer.name ?? detailCourse.lecturer.email}</p>
                        <p className="text-sm text-gray-500">{detailCourse.lecturer.email}</p>
                        {detailCourse.lecturer.departmentCode && (
                          <p className="text-sm text-gray-500">{departments.find(d => d.code === detailCourse.lecturer?.departmentCode)?.name ?? detailCourse.lecturer.departmentCode}</p>
                        )}
                      </div>
                    </div>
                    {canEditCourse(detailCourse) && (
                      <Button variant="outline" size="sm" onClick={() => { setDetailCourse(null); router.push(`/courses/${detailCourse.code}/edit`); }}>
                        Change Lecturer
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400 italic">No lecturer assigned</p>
                    {canEditCourse(detailCourse) && (
                      <Button variant="outline" size="sm" onClick={() => { setDetailCourse(null); router.push(`/courses/${detailCourse.code}/edit`); }}>
                        Change Lecturer
                      </Button>
                    )}
                  </div>
                )}
              </div>
              <div className="rounded-lg border p-4">
                <h3 className="font-medium mb-2">Schedule</h3>
                {detailCourse.schedules && detailCourse.schedules.length > 0 ? (
                  <p className="text-sm">{detailCourse.schedules[0]?.dayOfWeek}, {detailCourse.schedules[0]?.startTime} – {detailCourse.schedules[0]?.endTime}</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400 italic">Not yet scheduled</p>
                    {isStaff && canEditCourse(detailCourse) && (
                      <Button variant="outline" size="sm" onClick={() => { setDetailCourse(null); router.push(`/schedules/create?course=${encodeURIComponent(detailCourse.code)}`); }}>
                        Add to Schedule
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {isStaff && canEditCourse(detailCourse) && (
                <Button variant="outline" className="w-full border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => { setDetailCourse(null); router.push(`/courses/${detailCourse.code}/edit`); }}>
                  Edit Course
                </Button>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Upload modal */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="md:max-w-md" onSwipeDown={() => setIsUploadOpen(false)}>
          <DialogHeader>
            <DialogTitle>Upload Courses CSV</DialogTitle>
          </DialogHeader>
          <div className={isUploading ? "opacity-60 pointer-events-none" : ""}>
            <div
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
              onClick={() => !isUploading && document.getElementById("course-csv")?.click()}
            >
              <input
                id="course-csv"
                type="file"
                accept=".csv"
                className="hidden"
                disabled={isUploading}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }}
              />
              {selectedFile ? <p className="text-sm font-medium">{selectedFile.name}</p> : <p className="text-sm text-gray-500">Drop CSV or click to browse</p>}
            </div>
            <p className="text-xs text-gray-500 mt-2"><button type="button" className="underline" onClick={handleDownloadTemplate}>Download template</button></p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsUploadOpen(false)} disabled={isUploading}>Cancel</Button>
            <Button onClick={handleBulkUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteCourse}
        onOpenChange={(o) => !o && setDeleteCourse(null)}
        title="Delete course?"
        description={`This will permanently delete ${deleteCourse?.code}. This action cannot be undone.`}
        icon={Trash2}
        iconClassName="bg-red-500 text-white"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </div>
  );
}
