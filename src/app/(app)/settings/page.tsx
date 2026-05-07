"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, AlertTriangle, Database, RefreshCw } from "lucide-react";

type ActionKey =
  | "schedules"
  | "schedules-except-general"
  | "exam-schedules"
  | "courses"
  | "departments"
  | "all";

type SeedKey = "departments" | "courses" | "all";

interface DangerAction {
  key: ActionKey;
  label: string;
  description: string;
  confirmPhrase: string;
  adminOnly?: boolean;
}

interface SeedAction {
  key: SeedKey;
  label: string;
  description: string;
}

const DANGER_ACTIONS: DangerAction[] = [
  {
    key: "schedules",
    label: "Delete all schedules",
    description:
      "Permanently removes every class schedule from every session. This cannot be undone.",
    confirmPhrase: "delete all schedules",
  },
  {
    key: "schedules-except-general",
    label: "Delete all schedules (except general)",
    description:
      "Permanently removes every departmental schedule from every session while preserving general/university courses (GST, PIF, etc.). This cannot be undone.",
    confirmPhrase: "delete schedules except general",
  },
  {
    key: "exam-schedules",
    label: "Delete all exam schedules",
    description:
      "Permanently removes every exam schedule from every session. This cannot be undone.",
    confirmPhrase: "delete all exam schedules",
  },
  {
    key: "courses",
    label: "Delete all courses",
    description:
      "Permanently deletes every course, along with all linked schedules and exam schedules. This cannot be undone.",
    confirmPhrase: "delete all courses",
  },
  {
    key: "departments",
    label: "Delete all departments",
    description:
      "Permanently deletes every department, along with all linked courses, schedules and exam schedules. This cannot be undone.",
    confirmPhrase: "delete all departments",
  },
  {
    key: "all",
    label: "Delete all data",
    description:
      "Permanently deletes all departments, courses, schedules, exam schedules and complaints. Users and academic sessions are preserved. This cannot be undone.",
    confirmPhrase: "delete all data",
    adminOnly: true,
  },
];

const SEED_ACTIONS: SeedAction[] = [
  {
    key: "departments",
    label: "Seed departments",
    description:
      "Inserts built-in departments that do not already exist. Existing records are left untouched.",
  },
  {
    key: "courses",
    label: "Seed courses",
    description:
      "Inserts built-in courses for departments that are already present. Existing records are left untouched.",
  },
  {
    key: "all",
    label: "Seed all data",
    description:
      "Seeds departments first, then courses. Idempotent — safe to run multiple times.",
  },
];

interface ConfirmState {
  action: DangerAction;
  inputValue: string;
}

export default function SettingsPage() {
  const { isAdmin, isCollegeAdmin } = useAuth();
  const { toast } = useToast();
  usePageLoadReporter(false);

  const canAccess = isAdmin || isCollegeAdmin;

  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [dangerLoading, setDangerLoading] = useState<ActionKey | null>(null);
  const [seedLoading, setSeedLoading] = useState<SeedKey | null>(null);
  const [seedResults, setSeedResults] = useState<Record<string, string>>({});

  const visibleDangerActions = DANGER_ACTIONS.filter(
    (a) => !a.adminOnly || isAdmin,
  );

  const openConfirm = (action: DangerAction) => {
    setConfirmState({ action, inputValue: "" });
  };

  const closeConfirm = () => {
    if (dangerLoading) return;
    setConfirmState(null);
  };

  const handleDangerConfirm = async () => {
    if (!confirmState) return;
    const { action } = confirmState;
    setDangerLoading(action.key);
    try {
      let res: { success?: boolean; data?: any; error?: string };
      if (action.key === "schedules")
        res = await apiClient.deleteAllSchedules();
      else if (action.key === "exam-schedules")
        res = await apiClient.deleteAllExamSchedules();
      else if (action.key === "schedules-except-general")
        res = await apiClient.deleteAllSchedulesExceptGeneral();
      else if (action.key === "courses")
        res = await apiClient.deleteAllCourses();
      else if (action.key === "departments")
        res = await apiClient.deleteAllDepartments();
      else res = await apiClient.deleteAllData();

      if (res.success) {
        toast({ title: `${action.label} completed successfully.` });
        setConfirmState(null);
      } else {
        toast({
          title: res.error ?? "Operation failed",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Operation failed", variant: "destructive" });
    } finally {
      setDangerLoading(null);
    }
  };

  const handleSeed = async (seedAction: SeedAction) => {
    setSeedLoading(seedAction.key);
    setSeedResults((prev) => ({ ...prev, [seedAction.key]: "" }));
    try {
      let res: { success?: boolean; data?: any; error?: string };
      if (seedAction.key === "departments")
        res = await apiClient.seedDepartments();
      else if (seedAction.key === "courses")
        res = await apiClient.seedCourses();
      else res = await apiClient.seedAll();

      if (res.success && res.data) {
        const data = res.data as any;
        if (seedAction.key === "all") {
          const summary = `Departments: ${data.departments.created} created, ${data.departments.skipped} skipped. Courses: ${data.courses.created} created, ${data.courses.skipped} skipped.`;
          setSeedResults((prev) => ({ ...prev, [seedAction.key]: summary }));
          toast({ title: "Seed completed." });
        } else {
          const summary = `${data.created} created, ${data.skipped} skipped.`;
          setSeedResults((prev) => ({ ...prev, [seedAction.key]: summary }));
          toast({ title: `${seedAction.label} completed.` });
        }
      } else {
        toast({ title: res.error ?? "Seed failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Seed failed", variant: "destructive" });
    } finally {
      setSeedLoading(null);
    }
  };

  if (!canAccess) {
    return (
      <div className="max-w-[640px] mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">
            Settings are only available to administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[720px] mx-auto p-6 space-y-10">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Database className="h-4 w-4 text-indigo-600" />
            Data Seeding
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Populate the database with built-in departments and courses. Safe to
            run on an existing database — already-present records are skipped.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
          {SEED_ACTIONS.map((action) => (
            <div
              key={action.key}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {action.label}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {action.description}
                </p>
                {seedResults[action.key] && (
                  <p className="text-xs text-indigo-600 mt-1 font-medium">
                    {seedResults[action.key]}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-9"
                disabled={!!seedLoading}
                onClick={() => handleSeed(action)}
              >
                {seedLoading === action.key ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Run Seed
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            These actions are permanent and irreversible. Each requires you to
            type a confirmation phrase before proceeding.
          </p>
        </div>
        <div className="rounded-xl border border-red-200 bg-white divide-y divide-red-100">
          {visibleDangerActions.map((action) => (
            <div
              key={action.key}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900">
                  {action.label}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {action.description}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 h-9 border-red-300 text-red-700 hover:bg-red-50 hover:text-red-800"
                disabled={!!dangerLoading}
                onClick={() => openConfirm(action)}
              >
                {action.label}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={!!confirmState} onOpenChange={() => closeConfirm()}>
        <DialogContent
          className="sm:max-w-[480px]"
          onSwipeDown={closeConfirm}
          onPointerDownOutside={(e) => dangerLoading && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              {confirmState?.action.label}
            </DialogTitle>
            <DialogDescription className="pt-1">
              {confirmState?.action.description}
            </DialogDescription>
          </DialogHeader>

          {confirmState && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                This action cannot be undone. Please type{" "}
                <span className="font-semibold font-mono">
                  {confirmState.action.confirmPhrase}
                </span>{" "}
                to confirm.
              </div>
              <Input
                placeholder={`Type "${confirmState.action.confirmPhrase}" to confirm`}
                value={confirmState.inputValue}
                onChange={(e) =>
                  setConfirmState((prev) =>
                    prev ? { ...prev, inputValue: e.target.value } : null,
                  )
                }
                disabled={!!dangerLoading}
                className="font-mono"
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={closeConfirm}
              disabled={!!dangerLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                !!dangerLoading ||
                confirmState?.inputValue !== confirmState?.action.confirmPhrase
              }
              onClick={handleDangerConfirm}
            >
              {dangerLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
