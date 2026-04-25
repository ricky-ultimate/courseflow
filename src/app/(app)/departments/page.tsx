"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Download,
  Upload,
  Plus,
  Lock,
  Unlock,
  Trash2,
} from "lucide-react";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Department } from "@/types";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/state/error-state";
import { Pagination } from "@/components/ui/pagination";
import { FilterBar } from "@/components/ui/filter-bar";
import { DepartmentCard } from "@/components/departments/department-card";
import { DepartmentEditModal } from "@/components/departments/department-edit-modal";
import { DepartmentUploadModal } from "@/components/departments/department-upload-modal";

export default function DepartmentsPage() {
  const router = useRouter();
  const { isAdmin, isCollegeAdmin } = useAuth();
  const { toast } = useToast();

  const canManage = isAdmin || isCollegeAdmin;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const hasFetchedRef = useRef(false);
  usePageLoadReporter(loading);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hasCourses, setHasCourses] = useState(false);
  const [withoutCourses, setWithoutCourses] = useState(false);
  const [limit, setLimit] = useState(25);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    type: "lock" | "unlock" | "delete";
    dept: Department | null;
  }>({ open: false, type: "lock", dept: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mobileDeptMenu, setMobileDeptMenu] = useState<Department | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const fetchDepartments = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefetching(true);
      setFetchError(null);
      const params: Record<string, string | number | boolean> = {
        page,
        limit,
        ...(debouncedSearch && { searchTerm: debouncedSearch }),
        ...(hasCourses && { hasCourses: true }),
        ...(withoutCourses && { withoutCourses: true }),
      };
      const res = await apiClient.getDepartments(params);
      const result = getItemsFromResponse<Department>(res);
      if (result) {
        setDepartments(result.items);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      }
    } catch {
      setFetchError("Failed to load departments");
      toast({ title: "Failed to load departments", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefetching(false);
      hasFetchedRef.current = true;
    }
  }, [page, limit, debouncedSearch, hasCourses, withoutCourses, toast]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const handleConfirmAction = async (): Promise<boolean> => {
    const { dept, type } = confirmAction;
    if (!dept) return false;
    const prevLocked = dept.isScheduleLocked;
    if (type === "lock" || type === "unlock") {
      setDepartments((prev) =>
        prev.map((d) =>
          d.code === dept.code
            ? { ...d, isScheduleLocked: type === "lock" }
            : d,
        ),
      );
    }
    try {
      setActionLoading(true);
      let res: { success?: boolean };
      if (type === "lock")
        res = await apiClient.lockDepartmentSchedule(dept.code);
      else if (type === "unlock")
        res = await apiClient.unlockDepartmentSchedule(dept.code);
      else res = await apiClient.deleteDepartment(dept.code);
      if (res.success) {
        if (type === "lock")
          toast({ title: `Schedule locked for ${dept.name}.` });
        else if (type === "unlock")
          toast({ title: `Schedule unlocked for ${dept.name}.` });
        else toast({ title: "Department deleted." });
        fetchDepartments();
        return true;
      }
      if (type === "lock" || type === "unlock") {
        setDepartments((prev) =>
          prev.map((d) =>
            d.code === dept.code ? { ...d, isScheduleLocked: prevLocked } : d,
          ),
        );
      }
      toast({
        title: (res as any).error || "Action failed",
        variant: "destructive",
      });
      return false;
    } catch {
      if (type === "lock" || type === "unlock") {
        setDepartments((prev) =>
          prev.map((d) =>
            d.code === dept.code ? { ...d, isScheduleLocked: prevLocked } : d,
          ),
        );
      }
      toast({ title: "Action failed", variant: "destructive" });
      return false;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.getDepartmentsBulkTemplate();
      if (res.success && res.data) {
        const raw = res.data as unknown;
        const blob =
          raw instanceof Blob
            ? raw
            : new Blob([typeof raw === "string" ? raw : String(raw)], {
                type: "text/csv",
              });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "departments-template.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Template downloaded" });
      }
    } catch {
      toast({ title: "Failed to download template", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Departments
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage and browse all department listings
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full"
                onClick={() => setIsUploadOpen(true)}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
              <Button
                size="sm"
                className="rounded-full"
                onClick={() => router.push("/departments/create")}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Department
              </Button>
            </>
          )}
        </div>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by name or code..."
      >
        <div className="hidden md:flex items-center gap-1">
          <button
            type="button"
            onClick={() => setHasCourses(!hasCourses)}
            className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${hasCourses ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          >
            Has Courses
          </button>
          <button
            type="button"
            onClick={() => setWithoutCourses(!withoutCourses)}
            className={`text-sm px-3 py-1.5 rounded-full font-medium transition-colors ${withoutCourses ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"}`}
          >
            Without Courses
          </button>
        </div>
      </FilterBar>

      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState
            entity="departments"
            onRetry={() => {
              setFetchError(null);
              fetchDepartments();
            }}
          />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="min-h-[160px] rounded-xl border border-gray-200 p-5 animate-pulse"
            >
              <div className="h-4 bg-gray-200 rounded w-12 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="relative rounded-2xl border border-slate-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">
            No departments yet
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            Add your first department to get started.
          </p>
          {canManage && (
            <Button
              className="mt-5"
              onClick={() => router.push("/departments/create")}
            >
              <Plus className="h-4 w-4 mr-2" />+ New Department
            </Button>
          )}
        </div>
      ) : (
        <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {refetching && <RefetchIndicator />}
          {departments.map((dept) => (
            <DepartmentCard
              key={dept.id}
              dept={dept}
              isAdmin={!!canManage}
              canLockUnlock={!!canManage}
              onEdit={(d) => setEditDept(d)}
              onLock={(d) =>
                setConfirmAction({ open: true, type: "lock", dept: d })
              }
              onUnlock={(d) =>
                setConfirmAction({ open: true, type: "unlock", dept: d })
              }
              onDelete={(d) =>
                setConfirmAction({ open: true, type: "delete", dept: d })
              }
              onMobileMenu={(d) => setMobileDeptMenu(d)}
            />
          ))}
        </div>
      )}

      <Sheet
        open={!!mobileDeptMenu}
        onOpenChange={(o) => !o && setMobileDeptMenu(null)}
      >
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>
              {mobileDeptMenu?.name ?? "Department actions"}
            </SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 py-4">
            {mobileDeptMenu &&
              (() => {
                const d = mobileDeptMenu;
                const close = () => setMobileDeptMenu(null);
                return (
                  <>
                    <button
                      type="button"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                      onClick={() => {
                        router.push(`/departments/${d.code}`);
                        close();
                      }}
                    >
                      View Details
                    </button>
                    {canManage && (
                      <button
                        type="button"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                        onClick={() => {
                          setEditDept(d);
                          close();
                        }}
                      >
                        Edit Department
                      </button>
                    )}
                    {!d.isScheduleLocked && canManage && (
                      <button
                        type="button"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                        onClick={() => {
                          setConfirmAction({
                            open: true,
                            type: "lock",
                            dept: d,
                          });
                          close();
                        }}
                      >
                        Lock Schedule
                      </button>
                    )}
                    {d.isScheduleLocked && canManage && (
                      <button
                        type="button"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                        onClick={() => {
                          setConfirmAction({
                            open: true,
                            type: "unlock",
                            dept: d,
                          });
                          close();
                        }}
                      >
                        Unlock Schedule
                      </button>
                    )}
                    {canManage && (
                      <button
                        type="button"
                        className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-left w-full min-h-[52px] font-medium"
                        onClick={() => {
                          setConfirmAction({
                            open: true,
                            type: "delete",
                            dept: d,
                          });
                          close();
                        }}
                      >
                        Delete Department
                      </button>
                    )}
                  </>
                );
              })()}
          </div>
        </SheetContent>
      </Sheet>

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
        />
      )}

      <DepartmentUploadModal
        open={isUploadOpen}
        onOpenChange={setIsUploadOpen}
        onSuccess={fetchDepartments}
      />
      <DepartmentEditModal
        dept={editDept}
        onClose={() => setEditDept(null)}
        onSuccess={fetchDepartments}
      />

      <ConfirmDialog
        open={confirmAction.open && confirmAction.type === "lock"}
        onOpenChange={(o) =>
          !o && setConfirmAction({ open: false, type: "lock", dept: null })
        }
        title="Lock schedule?"
        description={`Lock the schedule for ${confirmAction.dept?.name}. No changes can be made until unlocked.`}
        icon={Lock}
        iconClassName="bg-amber-500 text-white"
        confirmLabel="Lock"
        confirmClassName="bg-amber-600 hover:bg-amber-700 text-white"
        onConfirm={handleConfirmAction}
        loading={actionLoading}
      />
      <ConfirmDialog
        open={confirmAction.open && confirmAction.type === "unlock"}
        onOpenChange={(o) =>
          !o && setConfirmAction({ open: false, type: "unlock", dept: null })
        }
        title="Unlock schedule?"
        description={`Unlock the schedule for ${confirmAction.dept?.name}.`}
        icon={Unlock}
        iconClassName="bg-green-500 text-white"
        confirmLabel="Unlock"
        confirmClassName="bg-green-600 hover:bg-green-700 text-white"
        onConfirm={handleConfirmAction}
        loading={actionLoading}
      />
      <ConfirmDialog
        open={confirmAction.open && confirmAction.type === "delete"}
        onOpenChange={(o) =>
          !o && setConfirmAction({ open: false, type: "delete", dept: null })
        }
        title="Delete department?"
        description={`This will permanently deactivate ${confirmAction.dept?.name}. Courses in this department will not be deleted but the department will no longer appear in listings.`}
        icon={Trash2}
        iconClassName="bg-red-500 text-white"
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={handleConfirmAction}
        loading={actionLoading}
      />
    </div>
  );
}
