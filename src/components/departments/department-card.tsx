"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Lock, Unlock, MoreVertical } from "lucide-react";
import { Department } from "@/types";
import { getInitials } from "@/lib/utils";
import { COLLEGE_BADGE } from "@/lib/constants";

interface DepartmentCardProps {
  dept: Department;
  isAdmin: boolean;
  canLockUnlock: boolean;
  onEdit: (d: Department) => void;
  onLock: (d: Department) => void;
  onUnlock: (d: Department) => void;
  onDelete: (d: Department) => void;
  onMobileMenu: (d: Department) => void;
}

export function DepartmentCard({
  dept,
  isAdmin,
  canLockUnlock,
  onEdit,
  onLock,
  onUnlock,
  onDelete,
  onMobileMenu,
}: DepartmentCardProps) {
  const router = useRouter();

  return (
    <div
      className="group flex flex-col min-h-[160px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-150 hover:shadow-md cursor-pointer"
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest("[data-menu]"))
          router.push(`/departments/${dept.code}`);
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <Badge
          variant="outline"
          className={COLLEGE_BADGE[dept.college] ?? "bg-gray-100 text-gray-700"}
        >
          {dept.college}
        </Badge>
        {isAdmin ? (
          <span data-menu>
            <button
              type="button"
              title={
                dept.isScheduleLocked ? "Unlock schedule" : "Lock schedule"
              }
              className="rounded p-1 hover:bg-gray-100 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                dept.isScheduleLocked ? onUnlock(dept) : onLock(dept);
              }}
            >
              {dept.isScheduleLocked ? (
                <Lock className="h-4 w-4 text-amber-500" />
              ) : (
                <Unlock className="h-4 w-4 text-gray-400" />
              )}
            </button>
          </span>
        ) : dept.isScheduleLocked ? (
          <span title="Schedule locked">
            <Lock className="h-4 w-4 text-amber-500" />
          </span>
        ) : null}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mt-2">{dept.name}</h3>
      <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">
        {dept.code}
      </span>
      <p className="text-sm text-gray-500 mt-2 line-clamp-2">
        {dept.description || "—"}
      </p>
      <div className="mt-auto pt-4 border-t flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {dept.hod ? (
            <>
              <span className="text-sm text-gray-500 shrink-0">HOD:</span>
              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700 shrink-0">
                {getInitials(dept.hod.name)}
              </div>
              <span className="text-sm truncate">{dept.hod.name}</span>
            </>
          ) : (
            <span className="text-sm text-gray-400 italic">
              No HOD assigned
            </span>
          )}
        </div>
        <div data-menu>
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-11 w-11 touch-manipulation"
                >
                  <MoreVertical className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => router.push(`/departments/${dept.code}`)}
                >
                  View Details
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem onClick={() => onEdit(dept)}>
                    Edit Department
                  </DropdownMenuItem>
                )}
                {canLockUnlock && (
                  <>
                    <DropdownMenuSeparator />
                    {!dept.isScheduleLocked && (
                      <DropdownMenuItem onClick={() => onLock(dept)}>
                        Lock Schedule
                      </DropdownMenuItem>
                    )}
                    {dept.isScheduleLocked && (
                      <DropdownMenuItem onClick={() => onUnlock(dept)}>
                        Unlock Schedule
                      </DropdownMenuItem>
                    )}
                  </>
                )}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => onDelete(dept)}
                    >
                      Delete Department
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="md:hidden h-11 w-11 touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              onMobileMenu(dept);
            }}
            aria-label="Actions"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
