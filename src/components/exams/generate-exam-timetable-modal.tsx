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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
  const [showConfirm, setShowConfirm] = useState(false);
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
    if (open) fetchData();
  }, [open, fetchData]);

  const handleSubmit = async () => {
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
      }
    } catch {
      setServerError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    onOpenChange(false);
  };

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
          <DialogTitle>Generate Exam Timetable</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center text-center">
              {result.skippedCourses.length === 0 ? (
                <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
              ) : (
                <AlertCircle className="h-10 w-10 text-amber-500 mb-2" />
              )}
              <h3 className="text-lg font-semibold">
                {result.skippedCourses.length === 0
                  ? "Exam Timetable Generated"
                  : "Generation Completed with Warnings"}
              </h3>
            </div>
            <div className="rounded-lg border bg-gray-50 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Session</span>
                <span className="font-medium">
                  {sessions.find((s) => s.id === activeSessionId)?.name ??
                    result.sessionName}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Semester</span>
                <span className="font-medium">
                  {semester === Semester.FIRST ? "First" : "Second"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Courses</span>
                <span className="font-medium">{result.totalCourses}</span>
              </div>
              <div className="flex justify-between">
                <span>Exams Scheduled</span>
                <span className="font-medium">{result.scheduledExams}</span>
              </div>
              {result.skippedCourses.length > 0 && (
                <div className="flex justify-between">
                  <span>Skipped</span>
                  <span className="font-medium text-amber-700">
                    {result.skippedCourses.length} course
                    {result.skippedCourses.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
            {result.skippedCourses.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-1">
                <p className="text-xs font-medium text-amber-800 mb-1">
                  Could not schedule:
                </p>
                {result.skippedCourses.map((c) => (
                  <div key={c} className="text-sm font-mono text-amber-700">
                    {c}
                  </div>
                ))}
              </div>
            )}
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
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {fetchError}
            </h3>
            <Button variant="outline" onClick={fetchData} className="mt-4">
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div
              className={`space-y-4 py-4 transition-opacity ${loading ? "opacity-60" : ""}`}
            >
              <div className="rounded-lg border-l-[3px] border-amber-600 bg-amber-50 py-3 px-4 text-sm text-amber-800">
                This will delete and regenerate all exam schedules for the
                selected scope, spreading them across the 3 weeks before session
                end.
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
                <div>
                  <Label>Department (optional)</Label>
                  <Select
                    value={departmentCode || "__all__"}
                    onValueChange={(v) =>
                      setDepartmentCode(v === "__all__" ? "" : v)
                    }
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
                onClick={() => setShowConfirm(true)}
                disabled={loading || loadingData}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Generate"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={(o) => !o && setShowConfirm(false)}
        title="Generate exam timetable?"
        description="This will delete and regenerate all exam schedules for the selected scope."
        icon={ClipboardList}
        iconClassName="bg-indigo-500 text-white"
        confirmLabel="Generate"
        confirmClassName="bg-indigo-600 hover:bg-indigo-700 text-white"
        onConfirm={async () => {
          setShowConfirm(false);
          await handleSubmit();
        }}
        loading={loading}
      />
    </Dialog>
  );
}
