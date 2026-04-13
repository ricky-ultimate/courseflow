"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import { AcademicSession, Department, Level, Semester } from "@/types";
import { getItemsFromResponse } from "@/lib/utils";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarPlus,
} from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { UniversityCoursesScheduleModal } from "@/components/schedules/university-courses-schedule-modal";

const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

function parseUniversityCourseCodes(message: string): string[] {
  const match = /university courses:\s*([^.]+)\./i.exec(message);
  if (!match || !match[1]) return [];
  return match[1]
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

interface GenerateScheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  departmentCode?: string;
  departmentName?: string;
  isHod?: boolean;
}

export function GenerateScheduleModal({
  open,
  onOpenChange,
  onSuccess,
  departmentCode: hodDeptCode,
  departmentName: hodDeptName,
  isHod = false,
}: GenerateScheduleModalProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [semester, setSemester] = useState<Semester>(Semester.FIRST);
  const [departmentCode, setDepartmentCode] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [universityCoursesModalOpen, setUniversityCoursesModalOpen] =
    useState(false);
  const [universityCourseCodes, setUniversityCourseCodes] = useState<string[]>(
    [],
  );
  const [result, setResult] = useState<{
    success: boolean;
    session?: string;
    semester?: string;
    totalCourses?: number;
    scheduled?: number;
    preserved?: number;
    skipped?: number;
    level?: string | null;
    failedCourses?: string[];
    message?: string;
    isUniversityCourseError?: boolean;
    batchErrors?: Array<{ departmentCode: string; message: string }>;
    totalDepartments?: number;
    processedDepartments?: number;
  } | null>(null);

  const fetchData = useCallback(async () => {
    if (!open) return;
    setFetchError(null);
    setServerError("");
    setLoadingData(true);

    try {
      const [sessRes, activeRes] = await Promise.all([
        apiClient.getAcademicSessions({ limit: 50 }),
        apiClient.getActiveAcademicSession(),
      ]);

      const sess = getItemsFromResponse<AcademicSession>(sessRes);
      setSessions(sess?.items ?? []);

      const active =
        activeRes.success && activeRes.data
          ? (activeRes.data as AcademicSession)
          : null;
      const defaultId = active?.id ?? sess?.items?.[0]?.id ?? "";
      setActiveSessionId(defaultId);

      if (isHod && hodDeptCode) setDepartmentCode(hodDeptCode);
      else if (hodDeptCode) setDepartmentCode(hodDeptCode);
    } catch {
      setFetchError("Failed to load sessions");
    } finally {
      setLoadingData(false);
    }

    if (!isHod) {
      try {
        const deptRes = await apiClient.getDepartments({ limit: 100 });
        const deptResult = getItemsFromResponse<Department>(deptRes);
        setDepartments(deptResult?.items ?? []);
      } catch {
        setDepartments([]);
      }
    }
  }, [open, isHod, hodDeptCode]);

  useEffect(() => {
    if (open) fetchData();
  }, [open, fetchData]);

  const handleSubmit = async () => {
    setLoading(true);
    setResult(null);
    setServerError("");
    setUniversityCourseCodes([]);

    const isBatch = !departmentCode && !hodDeptCode && !isHod;

    try {
      const res = isBatch
        ? await apiClient.generateSchedulesBatch({
            semester,
            sessionId: activeSessionId || undefined,
            level: (level || undefined) as Level | undefined,
          })
        : await apiClient.generateSchedules({
            semester,
            sessionId: activeSessionId || undefined,
            departmentCode: departmentCode || hodDeptCode || undefined,
            level: (level || undefined) as Level | undefined,
          });

      if (res.success && res.data) {
        const d = res.data as any;
        const scheduledCount = d.scheduledCourses ?? d.scheduled ?? 0;
        const batchErrors = d.errors as
          | Array<{ departmentCode: string; message: string }>
          | undefined;

        setResult({
          success: true,
          session: d.sessionName ?? d.session ?? activeSessionId,
          semester: d.semester ?? semester,
          totalCourses: d.totalCourses ?? d.total,
          scheduled: scheduledCount,
          preserved: d.preservedOverrides ?? d.preserved,
          skipped: d.skippedLockedDepartments ?? d.skipped,
          level: d.level ?? null,
          batchErrors: batchErrors?.length ? batchErrors : undefined,
          totalDepartments: d.totalDepartments,
          processedDepartments: d.processedDepartments,
        });
        toast({
          title: `${scheduledCount} courses scheduled for ${semester === Semester.FIRST ? "First" : "Second"} semester.`,
        });
        onSuccess?.();
      } else {
        const errMsg = (res as { error?: string }).error;
        const statusCode = (res as { statusCode?: number }).statusCode;
        if (statusCode === 422 && errMsg) {
          const codes = parseUniversityCourseCodes(errMsg);
          if (codes.length > 0) {
            setUniversityCourseCodes(codes);
            setResult({
              success: false,
              message: errMsg,
              isUniversityCourseError: true,
            });
          } else {
            setResult({ success: false, message: errMsg });
          }
        } else if (errMsg) {
          setServerError(errMsg);
        } else {
          const errData = (res as any).data;
          const failed = errData?.failedCourses ?? errData?.courses ?? [];
          setResult({
            success: false,
            failedCourses: Array.isArray(failed) ? failed : [],
          });
        }
      }
    } catch (e: any) {
      const errMsg = e?.message ?? (e as { error?: string })?.error;
      if (errMsg) {
        setServerError(errMsg);
      } else {
        const errData = e?.data ?? e?.response?.data;
        const failed = errData?.failedCourses ?? errData?.courses ?? [];
        setResult({
          success: false,
          failedCourses: Array.isArray(failed) ? failed : [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setUniversityCourseCodes([]);
    onOpenChange(false);
  };

  const levelLabel = LEVEL_OPTIONS.find((l) => l.value === level)?.label;
  const isBatch = !departmentCode && !hodDeptCode && !isHod;

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) =>
          !loading && (result ? handleClose() : onOpenChange(o))
        }
      >
        <DialogContent
          className="sm:max-w-[520px] max-sm:fixed max-sm:bottom-0 max-sm:left-0 max-sm:right-0 max-sm:top-auto max-sm:max-h-[90vh] max-sm:rounded-t-2xl max-sm:rounded-b-none"
          onPointerDownOutside={(e) => result && e.preventDefault()}
          onSwipeDown={() => {
            if (loading) return;
            if (result) handleClose();
            else onOpenChange(false);
          }}
        >
          <div className="max-sm:mt-3 max-sm:w-10 max-sm:h-1 max-sm:mx-auto max-sm:rounded-full max-sm:bg-gray-300" />
          <DialogHeader>
            <DialogTitle>Generate Schedules</DialogTitle>
          </DialogHeader>

          {result ? (
            <div className="space-y-6 py-4">
              {result.success ? (
                <>
                  <div className="flex flex-col items-center text-center">
                    <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                    <h3 className="text-lg font-semibold">
                      {result.batchErrors?.length
                        ? "Schedule Generation Completed with Warnings"
                        : "Schedule Generation Complete"}
                    </h3>
                  </div>
                  <div className="rounded-lg border bg-gray-50 p-4 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Session</span>
                      <span className="font-medium">
                        {sessions.find((s) => s.id === activeSessionId)?.name ??
                          result.session ??
                          "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Semester</span>
                      <span className="font-medium">
                        {semester === Semester.FIRST ? "First" : "Second"}
                      </span>
                    </div>
                    {result.level && (
                      <div className="flex justify-between">
                        <span>Level</span>
                        <span className="font-medium">
                          {LEVEL_OPTIONS.find((l) => l.value === result.level)
                            ?.label ?? result.level}
                        </span>
                      </div>
                    )}
                    {result.totalDepartments != null && (
                      <div className="flex justify-between">
                        <span>Departments Processed</span>
                        <span className="font-medium">
                          {result.processedDepartments} /{" "}
                          {result.totalDepartments}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Total Courses</span>
                      <span className="font-medium">
                        {result.totalCourses ?? "—"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scheduled</span>
                      <span className="font-medium">
                        {result.scheduled ?? "—"}
                      </span>
                    </div>
                    {result.preserved != null && (
                      <div className="flex justify-between">
                        <span>Preserved</span>
                        <span className="font-medium">
                          {result.preserved} manual overrides
                        </span>
                      </div>
                    )}
                    {result.skipped != null && result.skipped > 0 && (
                      <div className="flex justify-between">
                        <span>Skipped (locked)</span>
                        <span className="font-medium">
                          {result.skipped}{" "}
                          {result.skipped === 1 ? "department" : "departments"}
                        </span>
                      </div>
                    )}
                  </div>
                  {result.batchErrors && result.batchErrors.length > 0 && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                        Departments with scheduling errors (
                        {result.batchErrors.length})
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {result.batchErrors.map((e) => (
                          <div
                            key={e.departmentCode}
                            className="flex items-start gap-2 text-xs text-amber-800"
                          >
                            <span className="font-mono font-semibold shrink-0 bg-amber-100 px-1.5 py-0.5 rounded">
                              {e.departmentCode}
                            </span>
                            <span className="truncate">{e.message}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose}>
                      Close
                    </Button>
                    <Button
                      asChild
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      <Link
                        href="/schedules"
                        onClick={() => {
                          onSuccess?.();
                          handleClose();
                        }}
                      >
                        View Schedules
                      </Link>
                    </Button>
                  </DialogFooter>
                </>
              ) : result.isUniversityCourseError &&
                universityCourseCodes.length > 0 ? (
                <>
                  <div className="flex flex-col items-center text-center">
                    <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
                    <h3 className="text-lg font-semibold">
                      Manual Assignment Required
                    </h3>
                    <p className="text-sm text-gray-500 mt-1 max-w-sm">
                      The auto-scheduler only assigns ESM and GST courses to
                      Fridays. The following university-wide courses need a
                      manually assigned time slot before generation can proceed.
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
                    <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
                      Courses requiring manual scheduling
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {universityCourseCodes.map((code) => (
                        <span
                          key={code}
                          className="text-xs font-mono font-semibold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                    Assign a day and time to each course. They will be pinned so
                    auto-generation respects them as occupied slots. Once
                    scheduled, retry auto-generation.
                  </div>
                  <DialogFooter className="gap-2 flex-col sm:flex-row">
                    <Button variant="outline" onClick={handleClose}>
                      Close
                    </Button>
                    <Button variant="outline" onClick={() => setResult(null)}>
                      Try Again
                    </Button>
                    <Button
                      className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => setUniversityCoursesModalOpen(true)}
                    >
                      <CalendarPlus className="h-4 w-4 mr-2" />
                      Schedule These Courses
                    </Button>
                  </DialogFooter>
                </>
              ) : result.message ? (
                <>
                  <div className="flex flex-col items-center text-center">
                    <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                    <h3 className="text-lg font-semibold">Scheduling Failed</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      The solver could not generate a valid schedule.
                    </p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">{result.message}</p>
                  </div>
                  <p className="text-sm text-gray-500">
                    Review the courses listed above, adjust constraints, then
                    try again.
                  </p>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose}>
                      Close
                    </Button>
                    <Button onClick={() => setResult(null)}>Try Again</Button>
                  </DialogFooter>
                </>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center">
                    <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
                    <h3 className="text-lg font-semibold">Scheduling Failed</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Could not find valid time slots for the following courses:
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-lg border p-3 space-y-1">
                    {(result.failedCourses ?? []).map(
                      (c: string, i: number) => (
                        <div key={i} className="text-sm font-mono">
                          {c}
                        </div>
                      ),
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Try reducing the number of courses per department/level or
                    contact an administrator.
                  </p>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={handleClose}>
                      Close
                    </Button>
                    <Button onClick={() => setResult(null)}>Try Again</Button>
                  </DialogFooter>
                </>
              )}
            </div>
          ) : fetchError ? (
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  {fetchError}
                </h3>
                <Button variant="outline" onClick={fetchData} className="mt-4">
                  Retry
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div
                className={`space-y-4 py-4 transition-opacity ${loading ? "opacity-60" : ""}`}
              >
                {isBatch ? (
                  <div className="rounded-lg border-l-[3px] border-blue-600 bg-blue-50 py-3 px-4 text-sm text-blue-800">
                    System-wide generation processes each department
                    independently to avoid timeouts. University courses are
                    scheduled first, then departmental courses in sequence. This
                    may take a moment.
                  </div>
                ) : (
                  <div className="rounded-lg border-l-[3px] border-amber-600 bg-amber-50 py-3 px-4 text-sm text-amber-800">
                    This will delete all auto-generated schedules for the
                    selected scope and regenerate them. Manual overrides and
                    fixed slots will be preserved.
                  </div>
                )}
                <div className="grid gap-4">
                  <div>
                    <Label>Semester</Label>
                    <Select
                      value={semester}
                      onValueChange={(v) => setSemester(v as Semester)}
                      disabled={loading || loadingData}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={Semester.FIRST}>
                          First Semester
                        </SelectItem>
                        <SelectItem value={Semester.SECOND}>
                          Second Semester
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Session</Label>
                    <Select
                      value={activeSessionId}
                      onValueChange={setActiveSessionId}
                      disabled={loading || loadingData}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue
                          placeholder={
                            loadingData ? "Loading..." : "Select session"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {hodDeptCode ? (
                    <div>
                      <Label>Department</Label>
                      <div className="mt-1.5 rounded-md border bg-gray-50 px-3 py-2 text-sm text-gray-600">
                        {hodDeptName ?? hodDeptCode}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Label>Department scope</Label>
                      <Select
                        value={departmentCode || "__all__"}
                        onValueChange={(v) =>
                          setDepartmentCode(v === "__all__" ? "" : v)
                        }
                        disabled={loading || loadingData}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="All Unlocked Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">
                            All Unlocked Departments (Batched)
                          </SelectItem>
                          {departments.map((d) => (
                            <SelectItem key={d.code} value={d.code}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label>Level (optional)</Label>
                    <Select
                      value={level || "__all__"}
                      onValueChange={(v) => setLevel(v === "__all__" ? "" : v)}
                      disabled={loading || loadingData}
                    >
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__all__">All Levels</SelectItem>
                        {LEVEL_OPTIONS.map((l) => (
                          <SelectItem key={l.value} value={l.value}>
                            {l.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {serverError && <ServerErrorBanner message={serverError} />}
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => setShowGenerateConfirm(true)}
                  disabled={loading || loadingData}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Generate Schedules"
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>

        <ConfirmDialog
          open={showGenerateConfirm}
          onOpenChange={(o) => !o && setShowGenerateConfirm(false)}
          title="Generate schedules?"
          description={
            isBatch
              ? `This will process all unlocked departments sequentially${levelLabel ? ` for ${levelLabel}` : ""} and regenerate their auto-generated schedules. Manual overrides and fixed slots will be preserved. Departments that fail to schedule will be listed in the results.`
              : `This will delete all auto-generated schedules for the selected scope${level ? ` (${levelLabel})` : ""} and regenerate them. Manual overrides and fixed slots will be preserved.`
          }
          icon={RefreshCw}
          iconClassName="bg-indigo-500 text-white"
          confirmLabel="Generate"
          confirmClassName="bg-indigo-600 hover:bg-indigo-700 text-white"
          onConfirm={async () => {
            setShowGenerateConfirm(false);
            await handleSubmit();
          }}
          loading={loading}
        />
      </Dialog>

      <UniversityCoursesScheduleModal
        open={universityCoursesModalOpen}
        onOpenChange={setUniversityCoursesModalOpen}
        courseCodes={universityCourseCodes}
        onSuccess={() => {
          setUniversityCoursesModalOpen(false);
          setResult(null);
          onSuccess?.();
        }}
      />
    </>
  );
}
