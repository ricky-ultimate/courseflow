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
import {
  AcademicSession,
  College,
  Department,
  GenerateExamTimetableResult,
  Level,
  Semester,
} from "@/types";
import { getItemsFromResponse } from "@/lib/utils";
import { ClipboardList, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

interface GenerateExamTimetableModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GenerateExamTimetableModal({
  open,
  onOpenChange,
  onSuccess,
}: GenerateExamTimetableModalProps) {
  const { toast } = useToast();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [semester, setSemester] = useState<Semester>(Semester.FIRST);
  const [departmentCode, setDepartmentCode] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [college, setCollege] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  const [confirmStep, setConfirmStep] = useState(false);
  const [result, setResult] = useState<GenerateExamTimetableResult | null>(
    null,
  );

  const fetchData = useCallback(async () => {
    if (!open) return;
    setFetchError(null);
    setServerError("");
    setLoadingData(true);
    try {
      const [sessRes, activeRes, deptRes] = await Promise.all([
        apiClient.getAcademicSessions({ limit: 50 }),
        apiClient.getActiveAcademicSession(),
        apiClient.getDepartments({ limit: 100 }),
      ]);
      const sess = getItemsFromResponse<AcademicSession>(sessRes);
      setSessions(sess?.items ?? []);
      const active =
        activeRes.success && activeRes.data
          ? (activeRes.data as AcademicSession)
          : null;
      setActiveSessionId(active?.id ?? sess?.items?.[0]?.id ?? "");
      const depts = getItemsFromResponse<Department>(deptRes);
      setDepartments(depts?.items ?? []);
    } catch {
      setFetchError("Failed to load data");
    } finally {
      setLoadingData(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setConfirmStep(false);
      fetchData();
    }
  }, [open, fetchData]);

  const handleGenerate = async () => {
    setLoading(true);
    setResult(null);
    setServerError("");
    try {
      const res = await apiClient.generateExamTimetable({
        semester,
        sessionId: activeSessionId || undefined,
        departmentCode: departmentCode || undefined,
        level: (level || undefined) as Level | undefined,
        college: (college || undefined) as College | undefined,
      });
      if (res.success && res.data) {
        const data = res.data as GenerateExamTimetableResult;
        setResult(data);
        toast({
          title: `${data.scheduledExams} exams scheduled for ${semester === Semester.FIRST ? "First" : "Second"} semester.`,
        });
        onSuccess?.();
      } else {
        setServerError(
          (res as { error?: string }).error ?? "Generation failed",
        );
        setConfirmStep(false);
      }
    } catch {
      setServerError("An unexpected error occurred");
      setConfirmStep(false);
    } finally {
      setLoading(false);
      setConfirmStep(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setConfirmStep(false);
    onOpenChange(false);
  };

  const renderForm = () => (
    <>
      <div
        className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}
      >
        <div className="rounded-lg border-l-[3px] border-amber-500 bg-amber-50 py-3 px-4 text-sm text-amber-800">
          This will delete and regenerate all exam schedules for the selected
          scope, spreading them across the 3 weeks before session end.
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
          <div>
            <Label>Department (optional)</Label>
            <Select
              value={departmentCode || "__all__"}
              onValueChange={(v) => setDepartmentCode(v === "__all__" ? "" : v)}
              disabled={loading || loadingData}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Departments</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.code} value={d.code}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <div>
            <Label>College (optional)</Label>
            <Select
              value={college || "__all__"}
              onValueChange={(v) => setCollege(v === "__all__" ? "" : v)}
              disabled={loading || loadingData}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="All Colleges" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Colleges</SelectItem>
                <SelectItem value={College.CBAS}>CBAS</SelectItem>
                <SelectItem value={College.CHMS}>CHMS</SelectItem>
                <SelectItem value={College.CAHS}>CAHS</SelectItem>
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
          Generate
        </Button>
      </DialogFooter>
    </>
  );

  const renderConfirm = () => (
    <>
      <div className="space-y-4">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          This will delete and regenerate all exam schedules for the selected
          scope. This action cannot be undone.
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
          {departmentCode && (
            <div className="flex justify-between">
              <span className="text-gray-500">Department</span>
              <span className="font-medium">
                {departments.find((d) => d.code === departmentCode)?.name ??
                  departmentCode}
              </span>
            </div>
          )}
          {level && (
            <div className="flex justify-between">
              <span className="text-gray-500">Level</span>
              <span className="font-medium">
                {LEVEL_OPTIONS.find((l) => l.value === level)?.label}
              </span>
            </div>
          )}
          {college && (
            <div className="flex justify-between">
              <span className="text-gray-500">College</span>
              <span className="font-medium">{college}</span>
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
    return (
      <>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {result.skippedCourses.length === 0 ? (
              <CheckCircle className="h-8 w-8 text-green-500 shrink-0" />
            ) : (
              <AlertCircle className="h-8 w-8 text-amber-500 shrink-0" />
            )}
            <div>
              <p className="font-semibold text-gray-900">
                {result.skippedCourses.length === 0
                  ? "Exam timetable generated"
                  : "Completed with warnings"}
              </p>
              <p className="text-sm text-gray-500">
                {result.scheduledExams} exams scheduled
              </p>
            </div>
          </div>
          <div className="rounded-lg border bg-gray-50 p-3 text-sm space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Session</span>
              <span className="font-medium">
                {sessions.find((s) => s.id === activeSessionId)?.name ??
                  result.sessionName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Courses</span>
              <span className="font-medium">{result.totalCourses}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Scheduled</span>
              <span className="font-medium">{result.scheduledExams}</span>
            </div>
            {result.skippedCourses.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-500">Skipped</span>
                <span className="font-medium text-amber-700">
                  {result.skippedCourses.length}
                </span>
              </div>
            )}
          </div>
          {result.skippedCourses.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-medium text-amber-800 mb-2">
                Could not schedule:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {result.skippedCourses.map((c) => (
                  <span
                    key={c}
                    className="text-xs font-mono bg-amber-100 text-amber-800 px-2 py-0.5 rounded"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Close
          </Button>
          <Button
            onClick={() => {
              onSuccess?.();
              handleClose();
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            View Exams
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
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
        onPointerDownOutside={(e) => (result || loading) && e.preventDefault()}
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
              ? "Exam Timetable"
              : confirmStep
                ? "Confirm Generation"
                : "Generate Exam Timetable"}
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
  );
}
