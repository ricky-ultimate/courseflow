"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
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
import { Progress } from "@/components/ui/progress";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import { AlertCircle, Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getItemsFromResponse } from "@/lib/utils";
import {
  ScheduleGenerationSummary,
  applyManualScheduling,
  formatGenerationMessage,
  hasGenerationIssues,
  summarizeBatchResult,
  summarizeSingleResult,
} from "@/lib/schedule-generation";
import { ScheduleGenerationReport } from "@/components/schedules/schedule-generation-report";
import { ManualScheduleModal } from "@/components/schedules/manual-schedule-modal";
import {
  AcademicSession,
  Department,
  Level,
  Programme,
  Role,
  ScheduleAssignment,
  Semester,
  UnscheduledCourse,
} from "@/types";

const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

const BATCH_STEPS = [
  "Initialising session",
  "Scheduling university courses",
  "Processing departments",
  "Resolving conflicts",
  "Finalising timetable",
];

const SINGLE_STEPS = [
  "Loading courses",
  "Running scheduling algorithm",
  "Applying constraints",
  "Saving schedules",
];

const NO_COURSES: UnscheduledCourse[] = [];

interface GenerateProgressPanelProps {
  isBatch: boolean;
  elapsedSeconds: number;
  progress: number;
  stepLabel: string;
}

function GenerateProgressPanel({
  isBatch,
  elapsedSeconds,
  progress,
  stepLabel,
}: GenerateProgressPanelProps) {
  const mins = Math.floor(elapsedSeconds / 60);
  const secs = elapsedSeconds % 60;
  const elapsedLabel =
    mins > 0 ? `${mins}m ${secs}s elapsed` : `${secs}s elapsed`;

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-center gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-600 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-900">
            {isBatch
              ? "Generating schedules for all departments"
              : "Generating schedules"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{stepLabel}</p>
        </div>
      </div>
      <Progress value={progress} />
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{Math.round(progress)}% complete</span>
        <span>{elapsedLabel}</span>
      </div>
      {isBatch && (
        <p className="text-xs text-gray-500 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
          Batch generation processes departments concurrently in bounded groups.
          This may take several minutes for large course catalogs.
        </p>
      )}
    </div>
  );
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
  const { user } = useAuth();
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
  const [report, setReport] = useState<ScheduleGenerationSummary | null>(null);
  const [manualCourses, setManualCourses] = useState<
    UnscheduledCourse[] | null
  >(null);

  const [progress, setProgress] = useState(0);
  const [stepLabel, setStepLabel] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressStepRef = useRef(0);

  const activeDeptCode = hodDeptCode || departmentCode;
  const collegeCode =
    user?.role === Role.COLLEGE_ADMIN ? (user.collegeCode ?? null) : null;
  const visibleDepartments = collegeCode
    ? departments.filter((d) => d.college === collegeCode)
    : departments;

  const stopTimers = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  const startProgress = (isBatchRun: boolean) => {
    const steps = isBatchRun ? BATCH_STEPS : SINGLE_STEPS;
    progressStepRef.current = 0;
    setProgress(0);
    setElapsedSeconds(0);
    setStepLabel(steps[0] ?? "");

    const stepDurationMs = isBatchRun ? 4000 : 1200;
    const maxAutoProgress = 88;

    progressTimerRef.current = setInterval(() => {
      progressStepRef.current += 1;
      const stepIndex = Math.min(progressStepRef.current, steps.length - 1);
      setStepLabel(steps[stepIndex] ?? "");
      setProgress(
        Math.min(
          (progressStepRef.current / steps.length) * maxAutoProgress,
          maxAutoProgress,
        ),
      );
    }, stepDurationMs);

    elapsedTimerRef.current = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
  };

  const finishProgress = () => {
    stopTimers();
    setProgress(100);
    setStepLabel("Done");
  };

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
      const active = activeRes.success ? (activeRes.data ?? null) : null;
      setActiveSessionId(active?.id ?? sess?.items?.[0]?.id ?? "");
      if (hodDeptCode) setDepartmentCode(hodDeptCode);
    } catch {
      setFetchError("Failed to load sessions");
    } finally {
      setLoadingData(false);
    }
    if (!isHod) {
      try {
        const deptRes = await apiClient.getDepartments({ limit: 100 });
        setDepartments(getItemsFromResponse<Department>(deptRes)?.items ?? []);
      } catch {
        setDepartments([]);
      }
    }
  }, [open, isHod, hodDeptCode]);

  useEffect(() => {
    if (open) {
      setConfirmStep(false);
      setReport(null);
      setManualCourses(null);
      setProgress(0);
      setElapsedSeconds(0);
      setStepLabel("");
      fetchData();
    }
    return () => {
      stopTimers();
    };
  }, [open, fetchData]);

  useEffect(() => {
    if (!activeDeptCode || activeDeptCode === "__all__") {
      setProgrammes([]);
      setProgramme("");
      return;
    }
    setLoadingProgrammes(true);
    apiClient
      .getDepartmentProgrammes(activeDeptCode)
      .then((res) => setProgrammes(res.success ? (res.data ?? []) : []))
      .catch(() => setProgrammes([]))
      .finally(() => setLoadingProgrammes(false));
  }, [activeDeptCode]);

  const handleDepartmentChange = (v: string) => {
    setDepartmentCode(v === "__all__" ? "" : v);
    setProgramme("");
  };

  const isBatch = !departmentCode && !hodDeptCode && !isHod;

  const handleGenerate = async () => {
    setLoading(true);
    setReport(null);
    setServerError("");
    startProgress(isBatch);

    try {
      const levelFilter = (level || undefined) as Level | undefined;
      const sessionId = activeSessionId || undefined;
      let nextReport: ScheduleGenerationSummary | null = null;
      let errorMessage: string | null = null;

      if (isBatch) {
        const res = await apiClient.generateSchedulesBatch({
          semester,
          sessionId,
          level: levelFilter,
        });
        if (res.success && res.data) {
          nextReport = summarizeBatchResult(res.data);
        } else {
          errorMessage = res.error ?? "Schedule generation failed";
        }
      } else {
        const res = await apiClient.generateSchedules({
          semester,
          sessionId,
          departmentCode: departmentCode || hodDeptCode || undefined,
          level: levelFilter,
          programme: programme || undefined,
        });
        if (res.success && res.data) {
          nextReport = summarizeSingleResult(res.data);
        } else {
          errorMessage = res.error ?? "Schedule generation failed";
        }
      }

      if (nextReport) {
        finishProgress();
        setReport(nextReport);
        toast({
          title: formatGenerationMessage(nextReport),
          variant: hasGenerationIssues(nextReport) ? "warning" : "success",
        });
        onSuccess?.();
      } else {
        stopTimers();
        setServerError(errorMessage ?? "Schedule generation failed");
      }
    } catch {
      stopTimers();
      setServerError("An unexpected error occurred");
    } finally {
      setLoading(false);
      setConfirmStep(false);
    }
  };

  const handleManualScheduled = (assignments: ScheduleAssignment[]) => {
    setReport((prev) =>
      prev ? applyManualScheduling(prev, assignments) : prev,
    );
    onSuccess?.();
  };

  const canScheduleCourse = (course: UnscheduledCourse): boolean => {
    if (isHod) return user?.departmentCode === course.departmentCode;
    return true;
  };

  const handleClose = () => {
    stopTimers();
    setReport(null);
    setManualCourses(null);
    setConfirmStep(false);
    setProgramme("");
    setProgress(0);
    setElapsedSeconds(0);
    setStepLabel("");
    onOpenChange(false);
  };

  const levelLabel = LEVEL_OPTIONS.find((l) => l.value === level)?.label;
  const showProgrammeSelect =
    !isBatch && !!activeDeptCode && programmes.length > 1;

  const renderForm = () => (
    <>
      <div
        className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}
      >
        {isBatch ? (
          <div className="rounded-lg border-l-[3px] border-blue-500 bg-blue-50 py-3 px-4 text-sm text-blue-800">
            System-wide generation processes departments independently.
            University courses are scheduled first, then departmental courses.
            Courses that cannot be placed are reported so you can schedule them
            manually.
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
                  {visibleDepartments.map((d) => (
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
            ? `This will process all unlocked departments${levelLabel ? ` for ${levelLabel}` : ""} and regenerate their auto-generated schedules. Manual overrides and fixed slots will be preserved.`
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
    if (!report) return null;
    return (
      <>
        <ScheduleGenerationReport
          summary={report}
          canScheduleCourse={canScheduleCourse}
          onScheduleCourses={setManualCourses}
        />
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
  };

  const dialogTitle = loading
    ? "Generating Schedules..."
    : report
      ? hasGenerationIssues(report)
        ? "Generation Completed with Warnings"
        : "Generation Complete"
      : confirmStep
        ? "Confirm Generation"
        : "Generate Schedules";

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (loading) return;
          if (report) {
            handleClose();
            return;
          }
          if (confirmStep) {
            setConfirmStep(false);
            return;
          }
          onOpenChange(o);
        }}
      >
        <DialogContent
          className="sm:max-w-[560px]"
          onPointerDownOutside={(e) =>
            (report || loading) && e.preventDefault()
          }
          onSwipeDown={() => {
            if (loading) return;
            if (report) handleClose();
            else if (confirmStep) setConfirmStep(false);
            else onOpenChange(false);
          }}
        >
          <DialogHeader>
            <DialogTitle>{dialogTitle}</DialogTitle>
          </DialogHeader>
          {fetchError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <AlertCircle className="h-10 w-10 text-red-500 mb-3" />
              <p className="text-sm text-gray-600">{fetchError}</p>
              <Button variant="outline" onClick={fetchData} className="mt-4">
                Retry
              </Button>
            </div>
          ) : loading ? (
            <GenerateProgressPanel
              isBatch={isBatch}
              elapsedSeconds={elapsedSeconds}
              progress={progress}
              stepLabel={stepLabel}
            />
          ) : report ? (
            renderResult()
          ) : confirmStep ? (
            renderConfirm()
          ) : (
            renderForm()
          )}
        </DialogContent>
      </Dialog>

      <ManualScheduleModal
        open={manualCourses !== null}
        onOpenChange={(o) => {
          if (!o) setManualCourses(null);
        }}
        courses={manualCourses ?? NO_COURSES}
        onScheduled={handleManualScheduled}
      />
    </>
  );
}
