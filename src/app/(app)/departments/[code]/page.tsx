"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { ArrowLeft } from "lucide-react";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { AcademicSession, Course, Department } from "@/types";
import { Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { useToast } from "@/hooks/use-toast";
import { ErrorState } from "@/components/state/error-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { GenerateScheduleModal } from "@/components/dashboard/generate-schedule-modal";
import { DepartmentInfoCards } from "@/components/departments/department-info-cards";
import { DepartmentCoursesSection } from "@/components/departments/department-courses-section";
import { DepartmentEditModal } from "@/components/departments/department-edit-modal";
import { CourseDetailContent } from "@/components/courses/course-detail-content";
import { COLLEGE_BADGE } from "@/lib/constants";

export default function DepartmentDetailsPage() {
  const params = useParams();
  const { toast } = useToast();
  const { isAdmin, isHod, user } = useAuth();
  const code = params.code as string;

  const [department, setDepartment] = useState<Department | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  usePageLoadReporter(loading);

  const [editOpen, setEditOpen] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [detailCourse, setDetailCourse] = useState<Course | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteCourse, setDeleteCourse] = useState<Course | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const canLockUnlock = !!(
    department &&
    (isAdmin || (isHod && user?.departmentCode === department.code))
  );
  const canAddCourse = !!(isAdmin || (isHod && user?.departmentCode === code));
  const canEditCourse = (c: Course) =>
    !!(isAdmin || (isHod && user?.departmentCode === c.departmentCode));
  const canGenerateSchedule = !!(
    isAdmin ||
    (isHod && user?.departmentCode === code)
  );

  const fetchDetails = useCallback(() => {
    if (!code) return;
    setFetchError(null);
    setLoading(true);
    apiClient
      .getDepartmentFullDetails(code)
      .then((response) => {
        if (response.success && response.data) {
          const raw = response.data as { data?: Department } | Department;
          const dept =
            (raw as { data?: Department }).data ?? (raw as Department);
          if (!dept?.name) {
            setFetchError("Invalid department data");
            return;
          }
          setDepartment(dept);
          setCourses(
            Array.isArray((dept as any).courses) ? (dept as any).courses : [],
          );
        } else {
          setFetchError(response.error || "Failed to fetch department details");
        }
      })
      .catch((e) =>
        setFetchError(
          e instanceof Error ? e.message : "Failed to fetch department details",
        ),
      )
      .finally(() => setLoading(false));
  }, [code]);

  useEffect(() => {
    if (code) fetchDetails();
  }, [code, fetchDetails]);

  useEffect(() => {
    apiClient
      .getAcademicSessions({ limit: 50 })
      .then((res) => {
        const r = getItemsFromResponse<AcademicSession>(res);
        if (r) setSessions(r.items);
      })
      .catch(() => {});
    apiClient
      .getDepartments({ limit: 100 })
      .then((res) => {
        const r = getItemsFromResponse<Department>(res);
        if (r) setDepartments(r.items);
      })
      .catch(() => {});
  }, []);

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

  const handleLockToggle = async () => {
    if (!department) return;
    const prevLocked = department.isScheduleLocked;
    setDepartment((d) =>
      d ? { ...d, isScheduleLocked: !d.isScheduleLocked } : null,
    );
    setLockLoading(true);
    try {
      const fn = prevLocked
        ? apiClient.unlockDepartmentSchedule
        : apiClient.lockDepartmentSchedule;
      const res = await fn(department.code);
      if (res.success) {
        toast({
          title: prevLocked
            ? `Schedule unlocked for ${department.name}.`
            : `Schedule locked for ${department.name}.`,
        });
        apiClient
          .getDepartmentByCode(department.code)
          .then((r) => {
            if (r.success && r.data) setDepartment(r.data as Department);
          })
          .catch(() => {});
      } else {
        setDepartment((d) =>
          d ? { ...d, isScheduleLocked: prevLocked } : null,
        );
        toast({
          title: (res as any).error ?? "Failed",
          variant: "destructive",
        });
      }
    } catch {
      setDepartment((d) => (d ? { ...d, isScheduleLocked: prevLocked } : null));
      toast({ title: "Failed", variant: "destructive" });
    } finally {
      setLockLoading(false);
    }
  };

  const handleDeleteCourse = async (): Promise<boolean> => {
    if (!deleteCourse) return false;
    try {
      setDeleteLoading(true);
      const res = await apiClient.deleteCourse(deleteCourse.code);
      if (res.success) {
        toast({ title: `Course ${deleteCourse.code} deleted.` });
        setDeleteCourse(null);
        fetchDetails();
        return true;
      }
      toast({ title: (res as any).error ?? "Failed", variant: "destructive" });
      return false;
    } catch {
      toast({ title: "Delete failed", variant: "destructive" });
      return false;
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/4" />
        <div className="h-64 bg-gray-200 rounded" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div>
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/departments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Departments
          </Link>
        </Button>
        <ErrorState entity="department details" onRetry={fetchDetails} />
      </div>
    );
  }

  if (!department) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Department not found</p>
        <Button variant="outline" asChild className="mt-4">
          <Link href="/departments">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Departments
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Button variant="ghost" asChild className="mb-4">
        <Link href="/departments">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Departments
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-[28px] font-bold">{department.name}</h1>
        <Badge
          variant="outline"
          className={
            COLLEGE_BADGE[department.college] ??
            "bg-gray-100 text-gray-700 border-gray-200"
          }
        >
          {department.college}
        </Badge>
      </div>

      <DepartmentInfoCards
        department={department}
        isAdmin={!!isAdmin}
        isHod={!!isHod}
        canLockUnlock={canLockUnlock}
        lockLoading={lockLoading}
        onEdit={() => setEditOpen(true)}
        onLockToggle={handleLockToggle}
      />

      <DepartmentCoursesSection
        courses={courses}
        departmentCode={code}
        isAdmin={!!isAdmin}
        isHod={!!isHod}
        canAddCourse={canAddCourse}
        canGenerateSchedule={canGenerateSchedule}
        canEditCourse={canEditCourse}
        onView={openDetail}
        onDelete={setDeleteCourse}
        onGenerateSchedule={() => setGenerateModalOpen(true)}
      />

      <GenerateScheduleModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        departmentCode={code}
        departmentName={department.name}
        isHod={false}
        onSuccess={() => {}}
      />

      <DepartmentEditModal
        dept={editOpen ? department : null}
        onClose={() => setEditOpen(false)}
        onSuccess={fetchDetails}
      />

      {/* Course detail sheet */}
      <Sheet
        open={!!detailCourse}
        onOpenChange={(o) => !o && setDetailCourse(null)}
      >
        <SheetContent
          side="right"
          className="w-full sm:max-w-[480px] overflow-y-auto"
          hideCloseOnMobile
        >
          <SheetHeader className="md:sr-only">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden absolute left-4 top-4 z-10"
              onClick={() => setDetailCourse(null)}
            >
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
            <CourseDetailContent
              course={detailCourse}
              sessions={sessions}
              departments={departments}
              canEdit={canEditCourse(detailCourse)}
              canSchedule={!!(canAddCourse && canEditCourse(detailCourse))}
              onClose={() => setDetailCourse(null)}
            />
          ) : null}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteCourse}
        onOpenChange={(o) => !o && setDeleteCourse(null)}
        title="Delete course?"
        description={
          deleteCourse
            ? `This will permanently delete ${deleteCourse.code}. This action cannot be undone.`
            : ""
        }
        icon={Trash2}
        iconClassName="bg-red-500 text-white"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleDeleteCourse}
        loading={deleteLoading}
      />
    </div>
  );
}
