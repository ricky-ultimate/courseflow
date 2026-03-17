"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart2, Pencil, Trash2, MoreVertical } from "lucide-react";
import { AcademicSession, SessionStatistics } from "@/types";

interface SessionCardProps {
  session: AcademicSession;
  isActive: boolean;
  stats?: SessionStatistics;
  actionLoading: boolean;
  onActivate: (s: AcademicSession) => void;
  onArchive: (s: AcademicSession) => void;
  onEdit: (s: AcademicSession) => void;
  onStats: (s: AcademicSession) => void;
  onDelete: (s: AcademicSession) => void;
  onMobileMenu: (s: AcademicSession) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function SessionCard({ session, isActive, stats, actionLoading, onActivate, onArchive, onEdit, onStats, onDelete, onMobileMenu }: SessionCardProps) {
  const schedCount = stats?.totalSchedules ?? "—";
  const examCount = stats?.totalExams ?? "—";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">
      <div className="space-y-1 min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={isActive ? "default" : "secondary"} className={isActive ? "bg-green-600" : ""}>
              {isActive ? "Active" : "Archived"}
            </Badge>
            <span className="text-xl font-semibold">{session.name}</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              {!isActive && (
                <Button size="sm" variant="outline" className="h-9 border-indigo-600 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700" onClick={() => onActivate(session)} disabled={actionLoading}>Activate</Button>
              )}
              {isActive && (
                <Button size="sm" variant="outline" className="h-9" onClick={() => onArchive(session)} disabled={actionLoading}>Archive</Button>
              )}
              <Button size="icon" variant="ghost" className="h-11 w-11 touch-manipulation" onClick={() => onStats(session)}>
                <BarChart2 className="h-5 w-5" /><span className="sr-only">Statistics</span>
              </Button>
              <Button size="icon" variant="ghost" className="h-11 w-11 touch-manipulation" onClick={() => onEdit(session)}>
                <Pencil className="h-5 w-5" /><span className="sr-only">Edit</span>
              </Button>
              <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600 hover:text-red-700 touch-manipulation" onClick={() => onDelete(session)} disabled={actionLoading}>
                <Trash2 className="h-5 w-5" /><span className="sr-only">Delete</span>
              </Button>
            </div>
            <Button size="icon" variant="ghost" className="h-11 w-11 md:hidden touch-manipulation" onClick={() => onMobileMenu(session)} aria-label="Actions">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-500">{formatDate(session.startDate)} → {formatDate(session.endDate)}</p>
        <p className="text-sm text-gray-500">{schedCount} schedules · {examCount} exams</p>
      </div>
    </div>
  );
}
