"use client";

import { Sheet, SheetContent, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  Unlock,
  ArrowLeft,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  Calendar,
  User,
  Building2,
} from "lucide-react";
import { Schedule, Semester } from "@/types";
import { DAY_LABELS, LEVEL_PILL } from "@/lib/constants";
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
            ? "Slot pinned — auto-generation will not move it."
            : "Slot unpinned — auto-generation may reassign it.",
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

  const course = schedule.course;
  const levelLabel = course?.level?.replace("LEVEL_", "") ?? null;
  const levelPill = course?.level ? LEVEL_PILL[course.level] : "";

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

        <div className="pt-12 md:pt-0 flex flex-col gap-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <span className="text-xs font-mono font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                  {course?.code ?? schedule.courseCode}
                </span>
                {levelLabel && (
                  <Badge variant="secondary" className={`text-xs ${levelPill}`}>
                    {levelLabel}L
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 leading-snug">
                {course?.name ?? schedule.courseCode}
              </h2>
              {course?.departmentCode && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  <Building2 className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    {course.departmentCode}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {schedule.isFixed ? (
              <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200">
                <Lock className="h-3 w-3 mr-1" />
                Pinned
              </Badge>
            ) : schedule.isManualOverride ? (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                Manual Override
              </Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                Auto-generated
              </Badge>
            )}
            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
              {schedule.semester === Semester.FIRST
                ? "First Semester"
                : "Second Semester"}
            </Badge>
          </div>

          <div className="rounded-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
              <Calendar className="h-4 w-4 text-gray-400" />
              <span className="text-sm font-semibold text-gray-700">
                Time Slot
              </span>
              {sessionName && (
                <span className="ml-auto text-xs text-gray-400 bg-white border border-gray-200 rounded px-2 py-0.5">
                  {sessionName}
                </span>
              )}
            </div>
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Day
                </span>
                <span className="text-sm font-semibold text-gray-800">
                  {DAY_LABELS[schedule.dayOfWeek]}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  Time
                </span>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span className="text-sm font-semibold text-gray-800">
                    {schedule.startTime} – {schedule.endTime}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {course?.lecturer && (
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">
                  Lecturer
                </span>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700 shrink-0">
                    {(course.lecturer.name ??
                      course.lecturer.email ??
                      "?")[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {course.lecturer.name ?? course.lecturer.email}
                    </p>
                    {course.lecturer.name && (
                      <p className="text-xs text-gray-500 truncate">
                        {course.lecturer.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {canToggleFixed && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {schedule.isFixed ? "Slot is pinned" : "Pin this slot"}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  {schedule.isFixed
                    ? "Auto-generation will never move or delete this slot. Unpin to allow reassignment."
                    : "Prevent auto-generation from moving or deleting this slot."}
                </p>
              </div>
              <Button
                variant={schedule.isFixed ? "outline" : "default"}
                size="sm"
                className={
                  schedule.isFixed
                    ? "border-indigo-300 text-indigo-700 hover:bg-indigo-100 bg-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }
                onClick={handleToggleFixed}
                disabled={togglingFixed}
              >
                {togglingFixed ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : schedule.isFixed ? (
                  <Unlock className="h-3.5 w-3.5 mr-1.5" />
                ) : (
                  <Lock className="h-3.5 w-3.5 mr-1.5" />
                )}
                {schedule.isFixed ? "Unpin slot" : "Pin slot"}
              </Button>
            </div>
          )}

          {canMutate && (
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 h-10"
                onClick={() => onEdit(schedule)}
              >
                <Pencil className="h-4 w-4" />
                Edit Schedule
              </Button>
              <span
                title={
                  !canDelete && schedule.isFixed
                    ? "This slot is pinned. Contact an admin to remove it."
                    : undefined
                }
              >
                <Button
                  variant="outline"
                  className="w-full justify-start gap-2 h-10 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => onDelete(schedule)}
                  disabled={!canDelete}
                >
                  <Trash2 className="h-4 w-4" />
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
