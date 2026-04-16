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
  CheckCircle,
  AlertCircle,
  Loader2,
  CalendarPlus,
} from "lucide-react";
import Link from "next/link";
import { UniversityCoursesScheduleModal } from "@/components/schedules/university-courses-schedule-modal";

const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

interface Programme {
  programme: string;
  count: number;
}

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
  const [programmes, setProgrammes] = useState<Programme[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [semester, setSemester] = useState<Semester>(Semester.FIRST);
  const [departmentCode, setDepartmentCode] = useState<string>("");
  const [programme, setProgramme] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingProgrammes, setLoadingProgrammes] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);
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
    programme?: string | null;
    level?: string | null;
    failedCourses?: string[];
    message?: string;
    isUniversityCourseError?: boolean;
    batchErrors?: Array<{ departmentCode: string; message: string }>;
    totalDepartments?: number;
    processedDepartments?: number;
  } | null>(null);

  const activeDeptCode = hodDeptCode || departmentCode;

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
    if (open) {
      setConfirmStep(false);
      fetchData();
    }
  }, [open, fetchData]);

  useEffect(() => {
    const deptCode = activeDeptCode;
    if (!deptCode || deptCode === "__all__") {
      setProgrammes([]);
      setProgramme("");
      return;
    }
    setLoadingProgrammes(true);
    apiClient
      .getDepartmentProgrammes(deptCode)
      .then((res) => {
        if (res.success && Array.isArray(res.data)) {
          setProgrammes(res.data as Programme[]);
        } else {
          setProgrammes([]);
        }
      })
      .catch(() => setProgrammes([]))
      .finally(() => setLoadingProgrammes(false));
  }, [activeDeptCode]);

  const handleDepartmentChange = (v: string) => {
    setDepartmentCode(v === "__all__" ? "" : v);
    setProgramme("");
  };

  const handleGenerate = async () => {
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
            programme: programme || undefined,
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
          programme: (d.programme ?? programme) || null,
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
          setConfirmStep(false);
        } else {
          const failed = (res as any).data?.failedCourses ?? [];
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
        setConfirmStep(false);
      } else {
        const failed = e?.data?.failedCourses ?? [];
        setResult({
          success: false,
          failedCourses: Array.isArray(failed) ? failed : [],
        });
      }
    } finally {
      setLoading(false);
      setConfirmStep(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setConfirmStep(false);
    setProgramme("");
    setUniversityCourseCodes([]);
    onOpenChange(false);
  };

  const levelLabel = LEVEL_OPTIONS.find((l) => l.value === level)?.label;
  const isBatch = !departmentCode && !hodDeptCode && !isHod;
  const showProgrammeSelect =
    !isBatch && !!activeDeptCode && programmes.length > 1;

  const renderForm = () => (
    <>
      <div
        className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}
      >
        {isBatch ? (
          <div className="rounded-lg border-l-[3px] border-blue-500 bg-blue-50 py-3 px-4 text-sm text-blue-800">
            System-wide generation processes each department independently.
            University courses are scheduled first, then departmental courses in
            sequence.
          </div>
        ) : (
          <div className="rounded-lg border-l-[3px] border-amber-500 bg-amber-50 py-3 px-4 text-sm text-amber-800">
            This will delete all auto-generated schedules for the selected scope
            and regenerate them. Manual overrides and fixed slots will be
            preserved.
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
                <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
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
                onValueChange={handleDepartmentChange}
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
          {showProgrammeSelect && (
            <div>
              <Label>Programme (optional)</Label>
              <Select
                value={programme || "__all__"}
                onValueChange={(v) => setProgramme(v === "__all__" ? "" : v)}
                disabled={loading || loadingData || loadingProgrammes}
              >
                <SelectTrigger className="mt-1.5">
                  <SelectValue
                    placeholder={
                      loadingProgrammes ? "Loading..." : "All Programmes"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Programmes</SelectItem>
                  {programmes.map((p) => (
                    <SelectItem key={p.programme} value={p.programme}>
                      {p.programme}
                      <span className="ml-1.5 text-xs text-slate-400">
                        ({p.count} courses)
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 mt-1.5">
                Restrict generation to one programme within this department
                without affecting others.
              </p>
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
          onClick={() => setConfirmStep(true)}
          disabled={loading || loadingData}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Generate Schedules
        </Button>
      </DialogFooter>
    </>
  );

  const renderConfirm = () => (
    <>
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          {isBatch
            ? `This will process all unlocked departments sequentially${levelLabel ? ` for ${levelLabel}` : ""} and regenerate their auto-generated schedules. Manual overrides and fixed slots will be preserved.`
            : `This will delete all auto-generated schedules for the selected scope${programme ? ` (${programme} programme)` : ""}${level ? `, ${levelLabel}` : ""} and regenerate them. Manual overrides and fixed slots will be preserved.`}
        </div>
        <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1.5">
          <div className="flex justify-between">
            <span className="text-gray-500">Semester</span>
            <span className="font-medium">
              {semester === Semester.FIRST ? "First" : "Second"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Session</span>
            <span className="font-medium">
              {sessions.find((s) => s.id === activeSessionId)?.name ?? "—"}
            </span>
          </div>
          {(departmentCode || hodDeptCode) && (
            <div className="flex justify-between">
              <span className="text-gray-500">Department</span>
              <span className="font-medium">
                {hodDeptName ?? departmentCode ?? hodDeptCode}
              </span>
            </div>
          )}
          {programme && (
            <div className="flex justify-between">
              <span className="text-gray-500">Programme</span>
              <span className="font-medium">{programme}</span>
            </div>
          )}
          {level && (
            <div className="flex justify-between">
              <span className="text-gray-500">Level</span>
              <span className="font-medium">{levelLabel}</span>
            </div>
          )}
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setConfirmStep(false)}
          disabled={loading}
        >
          Back
        </Button>
        <Button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Confirm & Generate"
          )}
        </Button>
      </DialogFooter>
    </>
  );

  const renderResult = () => {
    if (!result) return null;
    if (result.success) {
      return (
        <>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
              <div>
                <p className="font-semibold text-gray-900">
                  {result.batchErrors?.length
                    ? "Completed with warnings"
                    : "Schedules generated"}
                </p>
                <p className="text-sm text-gray-500">
                  {result.scheduled ?? 0} courses scheduled
                </p>
              </div>
            </div>
            <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">Session</span>
                <span className="font-medium">
                  {sessions.find((s) => s.id === activeSessionId)?.name ??
                    result.session ??
                    "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Semester</span>
                <span className="font-medium">
                  {semester === Semester.FIRST ? "First" : "Second"}
                </span>
              </div>
              {result.totalDepartments != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Departments</span>
                  <span className="font-medium">
                    {result.processedDepartments} / {result.totalDepartments}
                  </span>
                </div>
              )}
              {result.programme && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Programme</span>
                  <span className="font-medium">{result.programme}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Total Courses</span>
                <span className="font-medium">
                  {result.totalCourses ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Scheduled</span>
                <span className="font-medium">{result.scheduled ?? "—"}</span>
              </div>
              {result.preserved != null && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Preserved overrides</span>
                  <span className="font-medium">{result.preserved}</span>
                </div>
              )}
              {(result.skipped ?? 0) > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Skipped (locked)</span>
                  <span className="font-medium">{result.skipped}</span>
                </div>
              )}
            </div>
            {result.batchErrors && result.batchErrors.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-1">
                  Departments with errors ({result.batchErrors.length})
                </p>
                {result.batchErrors.map((e) => (
                  <div
                    key={e.departmentCode}
                    className="flex items-start gap-2 text-xs text-amber-800"
                  >
                    <span className="font-mono font-semibold shrink-0 bg-amber-100 px-1.5 py-0.5 rounded">
                      {e.departmentCode}
                    </span>
                    <span>{e.message}</span>
                  </div>
                ))}
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
      );
    }

    if (result.isUniversityCourseError && universityCourseCodes.length > 0) {
      return (
        <>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-8 w-8 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">
                  Manual assignment required
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  The following university-wide courses need a time slot before
                  generation can proceed.
                </p>
              </div>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
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
            <p className="text-sm text-gray-500">
              Assign a day and time to each course. They will be pinned so
              auto-generation respects them as occupied slots. Once scheduled,
              retry generation.
            </p>
          </div>
          <DialogFooter className="gap-2">
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
      );
    }

    return (
      <>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-8 w-8 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-gray-900">Scheduling failed</p>
              <p className="text-sm text-gray-500 mt-0.5">
                {result.message ||
                  `Could not find valid time slots for ${result.failedCourses?.length ?? 0} course(s).`}
              </p>
            </div>
          </div>
          {result.failedCourses && result.failedCourses.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg border p-3 space-y-1">
              {result.failedCourses.map((c, i) => (
                <div key={i} className="text-sm font-mono">
                  {c}
                </div>
              ))}
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button onClick={() => setResult(null)}>Try Again</Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) =>
          !loading &&
          (result || confirmStep
            ? result
              ? handleClose()
              : setConfirmStep(false)
            : onOpenChange(o))
        }
      >
        <DialogContent
          className="sm:max-w-[520px]"
          onPointerDownOutside={(e) =>
            (result || loading) && e.preventDefault()
          }
          onSwipeDown={() => {
            if (loading) return;
            if (result) handleClose();
            else if (confirmStep) setConfirmStep(false);
            else onOpenChange(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {result
                ? result.success
                  ? "Generation Complete"
                  : "Generation Failed"
                : confirmStep
                  ? "Confirm Generation"
                  : "Generate Schedules"}
            </DialogTitle>
          </DialogHeader>
          {fetchError ? (
            <>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
                <p className="text-sm text-gray-600">{fetchError}</p>
                <Button variant="outline" onClick={fetchData} className="mt-4">
                  Retry
                </Button>
              </div>
            </>
          ) : result ? (
            renderResult()
          ) : confirmStep ? (
            renderConfirm()
          ) : (
            renderForm()
          )}
        </DialogContent>
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
