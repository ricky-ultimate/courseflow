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
import { RefreshCw, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

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
    try {
      const res = await apiClient.generateSchedules({
        semester,
        sessionId: activeSessionId || undefined,
        departmentCode: departmentCode || undefined,
        level: (level || undefined) as Level | undefined,
      });
      if (res.success && res.data) {
        const d = res.data as any;
        const scheduledCount = d.scheduledCourses ?? d.scheduled ?? 0;
        setResult({
          success: true,
          session: d.sessionName ?? d.session ?? activeSessionId,
          semester: d.semester ?? semester,
          totalCourses: d.totalCourses ?? d.total,
          scheduled: scheduledCount,
          preserved: d.preservedOverrides ?? d.preserved,
          skipped: d.skippedLockedDepartments ?? d.skipped,
          level: d.level ?? null,
        });
        toast({
          title: `${scheduledCount} courses scheduled for ${semester === Semester.FIRST ? "First" : "Second"} semester.`,
        });
        onSuccess?.();
      } else {
        const errMsg = (res as { error?: string }).error;
        const statusCode = (res as { statusCode?: number }).statusCode;
        if (statusCode === 422 && errMsg) {
          setResult({ success: false, message: errMsg });
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
    onOpenChange(false);
  };

  const levelLabel = LEVEL_OPTIONS.find((l) => l.value === level)?.label;

  return (
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
                    Schedule Generation Complete
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
                        {LEVEL_OPTIONS.find((l) => l.value === result.level)?.label ?? result.level}
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
                      <span>Skipped</span>
                      <span className="font-medium">
                        {result.skipped}{" "}
                        {result.skipped === 1 ? "department" : "departments"}
                      </span>
                    </div>
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Close
                  </Button>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700">
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
                  Review the courses listed above, adjust constraints, then try
                  again.
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
                  {(result.failedCourses ?? []).map((c: string, i: number) => (
                    <div key={i} className="text-sm font-mono">
                      {c}
                    </div>
                  ))}
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
              <div className="rounded-lg border-l-[3px] border-amber-600 bg-amber-50 py-3 px-4 text-sm text-amber-800">
                This will delete all auto-generated schedules for the selected
                scope and regenerate them. Manual overrides and fixed slots will
                be preserved.
              </div>
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
                        placeholder={loadingData ? "Loading..." : "Select session"}
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
                          All Unlocked Departments
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
        description={`This will delete all auto-generated schedules for the selected scope${level ? ` (${levelLabel})` : ""} and regenerate them. Manual overrides and fixed slots will be preserved.`}
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
  );
}
