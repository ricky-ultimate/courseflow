"use client";

import { useRouter } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lock, ArrowRight } from "lucide-react";
import { College } from "@/types";
import { CollegeData } from "@/hooks/use-colleges";
import { COLLEGE_NAMES } from "@/lib/constants";

interface CollegeDepartmentsSheetProps {
  college: College | null;
  collegeData: CollegeData | null;
  onClose: () => void;
}

export function CollegeDepartmentsSheet({
  college,
  collegeData,
  onClose,
}: CollegeDepartmentsSheetProps) {
  const router = useRouter();

  if (!college || !collegeData) return null;

  return (
    <Sheet open={!!college} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[480px] overflow-y-auto"
      >
        <SheetHeader>
          <SheetTitle>{COLLEGE_NAMES[college]}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          <p className="text-sm text-gray-500 font-medium">
            {collegeData.departments.length} department
            {collegeData.departments.length !== 1 ? "s" : ""}
          </p>

          {collegeData.departments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-sm text-gray-400">
                No departments in this college
              </p>
            </div>
          ) : (
            collegeData.departments.map((dept) => (
              <div
                key={dept.id}
                className="rounded-xl border border-gray-200 bg-white p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                        {dept.code}
                      </span>
                      {dept.isScheduleLocked && (
                        <span title="Schedule locked">
                          <Lock className="h-3.5 w-3.5 text-amber-500" />
                        </span>
                      )}
                      {!dept.isActive && (
                        <Badge
                          variant="secondary"
                          className="bg-gray-100 text-gray-500 text-xs"
                        >
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {dept.name}
                    </p>
                    {dept.hod ? (
                      <p className="text-xs text-gray-500 mt-1">
                        HOD: {dept.hod.name ?? dept.hod.email}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-400 italic mt-1">
                        No HOD assigned
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="shrink-0 h-8 w-8 p-0"
                    onClick={() => {
                      onClose();
                      router.push(`/departments/${dept.code}`);
                    }}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
