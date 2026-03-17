"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AcademicSession, SessionStatistics } from "@/types";

interface SessionStatsModalProps {
  session: AcademicSession | null;
  stats: SessionStatistics | null;
  loading: boolean;
  onClose: () => void;
}

export function SessionStatsModal({ session, stats, loading, onClose }: SessionStatsModalProps) {
  return (
    <Dialog open={!!session} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="md:max-w-[440px]" onSwipeDown={() => onClose()}>
        <DialogHeader>
          <DialogTitle>Statistics — {session?.name ?? ""}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 py-6">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-16 rounded-lg bg-gray-100 animate-pulse" />)}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border p-4"><p className="text-sm text-gray-500">Total Schedules</p><p className="text-2xl font-bold">{stats.totalSchedules}</p></div>
            <div className="rounded-lg border p-4"><p className="text-sm text-gray-500">First Semester Schedules</p><p className="text-2xl font-bold">{stats.schedulesBySemester?.FIRST ?? 0}</p></div>
            <div className="rounded-lg border p-4"><p className="text-sm text-gray-500">Second Semester Schedules</p><p className="text-2xl font-bold">{stats.schedulesBySemester?.SECOND ?? 0}</p></div>
            <div className="rounded-lg border p-4"><p className="text-sm text-gray-500">Total Exams</p><p className="text-2xl font-bold">{stats.totalExams}</p></div>
          </div>
        ) : (
          <p className="text-gray-500 py-4">Failed to load statistics.</p>
        )}
      </DialogContent>
    </Dialog>
  );
}
