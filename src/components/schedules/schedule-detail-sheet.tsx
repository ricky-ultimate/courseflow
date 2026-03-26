"use client";

import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Unlock, ArrowLeft, Pencil, Trash2, Loader2 } from "lucide-react";
import { Schedule, Semester } from "@/types";
import { DAY_LABELS } from "@/lib/constants";
import { useState } from "react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export interface ScheduleDetailSheetProps {
  schedule: Schedule | null;
  sessionName?: string;
  onClose: () => void;
  onEdit: (schedule: Schedule) => void;
  onDelete: (schedule: Schedule) => void;
  onFixedToggled?: (updated: Schedule) => void;
  canMutate?: boolean;
  isAdmin?: boolean;
}

export function ScheduleDetailSheet({
  schedule,
  sessionName,
  onClose,
  onEdit,
  onDelete,
  onFixedToggled,
  canMutate,
  isAdmin,
}: ScheduleDetailSheetProps) {
  const { toast } = useToast();
  const [togglingFixed, setTogglingFixed] = useState(false);

  if (!schedule) return null;

  const canDelete = canMutate && (schedule.isFixed ? !!isAdmin : true);
  const canToggleFixed = canMutate;

  const handleToggleFixed = async () => {
    setTogglingFixed(true);
    try {
      const res = await apiClient.toggleScheduleFixed(schedule.id);
      if (res.success && res.data) {
        const updated = res.data as Schedule;
        toast({
          title: updated.isFixed
            ? "Slot pinned. Auto-generation will no longer move it."
            : "Slot unpinned. Auto-generation may reassign it.",
        });
        onFixedToggled?.(updated);
      } else {
        toast({
          title: (res as { error?: string }).error ?? "Failed to update",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Failed to update", variant: "destructive" });
    } finally {
      setTogglingFixed(false);
    }
  };

  return (
    <Sheet open={!!schedule} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full max-sm:h-full sm:max-w-[420px] overflow-y-auto"
        hideCloseOnMobile
      >
        <SheetHeader className="md:sr-only">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden absolute left-4 top-4 z-10"
            onClick={onClose}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </SheetHeader>
        <div className="pt-12 md:pt-0 space-y-6">
          <div>
            <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
              {schedule.course?.code ?? schedule.courseCode}
            </span>
            <h2 className="text-xl font-semibold mt-2">
              {schedule.course?.name ?? "—"}
            </h2>
          </div>

          <div>
            <p className="text-lg font-semibold">
              {DAY_LABELS[schedule.dayOfWeek]}, {schedule.startTime} –{" "}
              {schedule.endTime}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {sessionName || schedule.sessionId} &middot;{" "}
              {schedule.semester === Semester.FIRST ? "First" : "Second"}{" "}
              Semester
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {schedule.isFixed ? (
              <Badge className="bg-indigo-100 text-indigo-700">
                <Lock className="h-3 w-3 mr-1" />
                Pinned
              </Badge>
            ) : schedule.isManualOverride ? (
              <Badge className="bg-amber-100 text-amber-700">
                Manual Override
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                Auto-generated
              </Badge>
            )}
          </div>

          <div className="rounded-lg border p-4 space-y-2">
            <p className="text-sm">
              <span className="text-gray-500">Level:</span>{" "}
              <Badge variant="secondary" className="text-xs">
                {schedule.course?.level?.replace("LEVEL_", "") ?? "—"}
              </Badge>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Department:</span>{" "}
              <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                {schedule.course?.departmentCode ?? "—"}
              </span>
            </p>
            <p className="text-sm">
              <span className="text-gray-500">Lecturer:</span>{" "}
              {schedule.course?.lecturer?.name &&
              schedule.course?.lecturer?.email
                ? `${schedule.course.lecturer.name} (${schedule.course.lecturer.email})`
                : (schedule.course?.lecturer?.name ??
                  schedule.course?.lecturer?.email ??
                  "—")}
            </p>
          </div>

          {canToggleFixed && (
            <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-4 space-y-2">
              <p className="text-sm font-medium text-gray-700">Pin this slot</p>
              <p className="text-xs text-gray-500">
                {schedule.isFixed
                  ? "This slot is pinned. The auto-generation algorithm will never move or delete it. Unpin to allow reassignment."
                  : "Pin this slot to prevent the auto-generation algorithm from ever moving or deleting it."}
              </p>
              <Button
                variant={schedule.isFixed ? "outline" : "default"}
                size="sm"
                className={
                  schedule.isFixed
                    ? "border-indigo-300 text-indigo-700 hover:bg-indigo-100"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }
                onClick={handleToggleFixed}
                disabled={togglingFixed}
              >
                {togglingFixed ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : schedule.isFixed ? (
                  <Unlock className="h-4 w-4 mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                {schedule.isFixed ? "Unpin slot" : "Pin slot"}
              </Button>
            </div>
          )}

          {canMutate && (
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => onEdit(schedule)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit Schedule
              </Button>
              <span
                title={
                  !canDelete && schedule.isFixed
                    ? "This slot is pinned. Contact an admin to remove it."
                    : undefined
                }
                className="block"
              >
                <Button
                  variant="outline"
                  className="w-full text-red-600 border-red-200 hover:bg-red-50"
                  onClick={() => onDelete(schedule)}
                  disabled={!canDelete}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Schedule
                </Button>
              </span>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
