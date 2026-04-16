"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, MoreVertical } from "lucide-react";
import { Complaint, ComplaintStatus } from "@/types";
import { formatRelativeDate } from "@/lib/utils";
import { ComplaintStatusBadge } from "./complaint-status-badge";

interface ComplaintsManagerTableProps {
  complaints: Complaint[];
  statusLoading: string | null;
  onView: (c: Complaint) => void;
  onStatusChange: (id: string, status: ComplaintStatus) => void;
}

export function ComplaintsManagerTable({
  complaints,
  statusLoading,
  onView,
  onStatusChange,
}: ComplaintsManagerTableProps) {
  return (
    <>
      <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b">
              <tr className="text-left text-sm text-gray-500">
                <th className="p-3">#</th>
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Department</th>
                <th className="p-3">Subject</th>
                <th className="p-3">Status</th>
                <th className="p-3">Submitted</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map((c, idx) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3 text-sm text-gray-500">{idx + 1}</td>
                  <td className="p-3 text-sm">{c.name}</td>
                  <td className="p-3 text-sm">{c.email}</td>
                  <td className="p-3 text-sm">{c.department}</td>
                  <td className="p-3 text-sm max-w-[200px]" title={c.subject}>
                    {(c.subject ?? "").length > 40
                      ? `${c.subject!.slice(0, 40)}...`
                      : c.subject}
                  </td>
                  <td className="p-3">
                    <ComplaintStatusBadge status={c.status} />
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {formatRelativeDate(c.createdAt)}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-11 w-11"
                        onClick={() => onView(c)}
                      >
                        <Eye className="h-5 w-5" />
                        <span className="sr-only">View</span>
                      </Button>
                      <Select
                        value={c.status}
                        onValueChange={(v) =>
                          onStatusChange(c.id, v as ComplaintStatus)
                        }
                        disabled={statusLoading === c.id}
                      >
                        <SelectTrigger className="w-[120px] h-11">
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {complaints.map((c) => (
          <div
            key={c.id}
            className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="font-semibold">{c.subject}</p>
              <ComplaintStatusBadge status={c.status} />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {c.name} · {c.department}
            </p>
            <p className="text-xs text-gray-500">
              {formatRelativeDate(c.createdAt)}
            </p>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {c.message}
            </p>
            <div className="border-t mt-3 pt-3 flex justify-end">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-11 w-11 shrink-0"
                  >
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onView(c)}>
                    View detail
                  </DropdownMenuItem>
                  {Object.values(ComplaintStatus).map((s) => (
                    <DropdownMenuItem
                      key={s}
                      onClick={() => onStatusChange(c.id, s)}
                    >
                      {s.replace("_", " ")}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
