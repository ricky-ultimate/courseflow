"use client";

import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";
import { Complaint, ComplaintStatus } from "@/types";
import { ComplaintStatusBadge } from "./complaint-status-badge";

interface ComplaintDetailDialogProps {
  complaint: Complaint | null;
  isAdmin: boolean;
  statusLoading: string | null;
  onClose: () => void;
  onStatusChange: (id: string, status: ComplaintStatus) => void;
}

export function ComplaintDetailDialog({
  complaint,
  isAdmin,
  statusLoading,
  onClose,
  onStatusChange,
}: ComplaintDetailDialogProps) {
  return (
    <Dialog open={!!complaint} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="md:max-w-[560px]" onSwipeDown={onClose}>
        {complaint && (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-2">
                <DialogTitle className="text-lg">
                  {complaint.subject}
                </DialogTitle>
                <ComplaintStatusBadge status={complaint.status} />
              </div>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-500">Name</span>
                <span>{complaint.name}</span>
                <span className="text-gray-500">Email</span>
                <span>{complaint.email}</span>
                <span className="text-gray-500">Department</span>
                <span>{complaint.department}</span>
                <span className="text-gray-500">Submitted</span>
                <span>{new Date(complaint.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <Label>Message</Label>
                <pre className="mt-1.5 max-h-[200px] overflow-y-auto rounded-lg border p-3 text-sm whitespace-pre-wrap">
                  {complaint.message}
                </pre>
              </div>
              {complaint.resolvedAt && (
                <p className="text-sm text-gray-500">
                  Resolved by {complaint.resolvedBy ?? "admin"} on{" "}
                  {new Date(complaint.resolvedAt).toLocaleString()}
                </p>
              )}
            </div>
            {isAdmin && (
              <DialogFooter>
                <Select
                  value={complaint.status}
                  onValueChange={(v) =>
                    onStatusChange(complaint.id, v as ComplaintStatus)
                  }
                  disabled={statusLoading === complaint.id}
                >
                  <SelectTrigger className="h-11 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ComplaintStatus).map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace("_", " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
