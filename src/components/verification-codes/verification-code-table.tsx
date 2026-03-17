"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clipboard, Pencil, Power, Trash2, MoreVertical } from "lucide-react";
import { VerificationCode } from "@/types";

interface VerificationCodeTableProps {
  codes: VerificationCode[];
  copiedId: string | null;
  actionLoading: boolean;
  onCopy: (c: VerificationCode) => void;
  onEdit: (c: VerificationCode) => void;
  onToggleActive: (c: VerificationCode) => void;
  onDelete: (c: VerificationCode) => void;
}

function formatExpiry(iso: string | null | undefined): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function VerificationCodeTable({ codes, copiedId, actionLoading, onCopy, onEdit, onToggleActive, onDelete }: VerificationCodeTableProps) {
  return (
    <>
      <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white border-b">
              <tr className="text-left text-sm text-gray-500">
                {["Code", "Role", "Description", "Usage", "Expires", "Status", "Created By", "Actions"].map((h) => <th key={h} className="p-3">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-1">
                      <code className="font-mono text-sm">{c.code}</code>
                      <div className="relative inline-flex">
                        {copiedId === c.id && (
                          <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-10 animate-in fade-in duration-150">Copied!</span>
                        )}
                        <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" onClick={() => onCopy(c)} title="Copy">
                          <Clipboard className="h-4 w-4" /><span className="sr-only">Copy</span>
                        </Button>
                      </div>
                    </div>
                  </td>
                  <td className="p-3"><Badge variant="secondary">{c.role}</Badge></td>
                  <td className="p-3 text-sm text-gray-600 max-w-[180px] truncate" title={c.description ?? ""}>{c.description ?? "—"}</td>
                  <td className="p-3">
                    {c.maxUsage != null ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (c.usageCount / c.maxUsage) * 100)}%` }} />
                        </div>
                        <span className="text-sm">{c.usageCount}/{c.maxUsage}</span>
                      </div>
                    ) : <span className="text-sm text-gray-500">Unlimited</span>}
                  </td>
                  <td className="p-3 text-sm">{formatExpiry(c.expiresAt)}</td>
                  <td className="p-3"><Badge className={c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>{c.isActive ? "Active" : "Inactive"}</Badge></td>
                  <td className="p-3 text-sm text-gray-600">{c.creator?.name ?? c.createdBy ?? "—"}</td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => onEdit(c)}><Pencil className="h-5 w-5" /><span className="sr-only">Edit</span></Button>
                      <Button size="icon" variant="ghost" className={`h-11 w-11 ${c.isActive ? "text-green-600" : "text-gray-500"}`} onClick={() => onToggleActive(c)} disabled={actionLoading}><Power className="h-5 w-5" /><span className="sr-only">Toggle</span></Button>
                      <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600" onClick={() => onDelete(c)}><Trash2 className="h-5 w-5" /><span className="sr-only">Delete</span></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="md:hidden space-y-3">
        {codes.map((c) => (
          <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <code className="font-mono text-sm">{c.code}</code>
                <div className="relative inline-flex">
                  {copiedId === c.id && (
                    <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-10 animate-in fade-in duration-150">Copied!</span>
                  )}
                  <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" onClick={() => onCopy(c)} title="Copy">
                    <Clipboard className="h-4 w-4" /><span className="sr-only">Copy</span>
                  </Button>
                </div>
              </div>
              <Badge variant="secondary">{c.role}</Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">{c.description ?? "—"}</p>
            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
              {c.maxUsage != null ? (
                <><div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-1 shrink-0"><div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (c.usageCount / c.maxUsage) * 100)}%` }} /></div><span>{c.usageCount}/{c.maxUsage}</span></>
              ) : <span>Unlimited</span>}
              <span>·</span>
              <span>Expires: {formatExpiry(c.expiresAt)}</span>
            </div>
            <div className="border-t mt-3 pt-3 flex items-center justify-between">
              <Badge className={c.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>{c.isActive ? "Active" : "Inactive"}</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button size="icon" variant="ghost" className="h-11 w-11 shrink-0"><MoreVertical className="h-5 w-5" /><span className="sr-only">Menu</span></Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(c)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleActive(c)}>{c.isActive ? "Deactivate" : "Activate"}</DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600" onClick={() => onDelete(c)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
