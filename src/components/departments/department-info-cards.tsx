"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Department } from "@/types";
import { getInitials } from "@/lib/utils";

interface DepartmentInfoCardsProps {
  department: Department;
  isAdmin: boolean;
  isHod: boolean;
  canLockUnlock: boolean;
  lockLoading: boolean;
  onEdit: () => void;
  onLockToggle: () => void;
}

export function DepartmentInfoCards({
  department,
  isAdmin,
  canLockUnlock,
  lockLoading,
  onEdit,
  onLockToggle,
}: DepartmentInfoCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Head of Department</CardTitle>
        </CardHeader>
        <CardContent>
          {department.hod ? (
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-base font-medium text-indigo-700 shrink-0">
                {getInitials(department.hod.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold">{department.hod.name}</p>
                {department.hod.email && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {department.hod.email}
                  </p>
                )}
                {department.hod.role && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {department.hod.role}
                  </Badge>
                )}
                {isAdmin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2 h-8 text-xs"
                    onClick={onEdit}
                  >
                    Edit
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-400 italic">Not assigned</p>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={onEdit}
                >
                  Assign HOD
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Department Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-sm text-muted-foreground">Code</p>
            <p className="font-mono text-sm">{department.code}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">College</p>
            <p className="text-sm">{department.college}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge
              variant="secondary"
              className={
                department.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }
            >
              {department.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Schedule lock</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm">
                {department.isScheduleLocked ? "Locked" : "Unlocked"}
              </span>
              {canLockUnlock && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={lockLoading}
                  onClick={onLockToggle}
                >
                  {department.isScheduleLocked ? "Unlock" : "Lock"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
