"use client";

import { Button } from "@/components/ui/button";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { MessageSquare, Plus } from "lucide-react";
import { Complaint } from "@/types";
import { formatRelativeDate } from "@/lib/utils";
import { ComplaintStatusBadge } from "./complaint-status-badge";

interface ComplaintsUserListProps {
  complaints: Complaint[];
  refetching: boolean;
  onView: (c: Complaint) => void;
  onSubmitClick: () => void;
}

export function ComplaintsUserList({
  complaints,
  refetching,
  onView,
  onSubmitClick,
}: ComplaintsUserListProps) {
  if (complaints.length === 0) {
    return (
      <div className="relative rounded-2xl border border-slate-200 p-12 text-center">
        {refetching && <RefetchIndicator />}
        <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-base font-semibold text-gray-700">
          You haven&apos;t submitted any complaints.
        </h3>
        <p className="text-sm text-gray-400 mt-2">
          Submit a complaint if you need assistance.
        </p>
        <Button className="mt-5" onClick={onSubmitClick}>
          <Plus className="h-4 w-4 mr-2" />+ Submit Complaint
        </Button>
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      {refetching && <RefetchIndicator />}
      {complaints.map((c) => (
        <div
          key={c.id}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:bg-gray-50"
          onClick={() => onView(c)}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{c.subject}</p>
              <p className="text-sm text-gray-500">
                {c.department} · {formatRelativeDate(c.createdAt)}
              </p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {c.message}
              </p>
            </div>
            <ComplaintStatusBadge status={c.status} />
          </div>
        </div>
      ))}
    </div>
  );
}
