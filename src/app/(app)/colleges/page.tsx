"use client";

import { useState } from "react";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { College } from "@/types";
import { useColleges } from "@/hooks/use-colleges";
import { CollegeCard } from "@/components/colleges/college-card";
import { CollegeDepartmentsSheet } from "@/components/colleges/college-departments-sheet";
import { ErrorState } from "@/components/state/error-state";

export default function CollegesPage() {
  const { colleges, loading, error, retry } = useColleges();
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);

  usePageLoadReporter(loading);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Colleges
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-gray-200 bg-white p-6 animate-pulse space-y-3"
            >
              <div className="h-5 bg-gray-200 rounded w-16" />
              <div className="h-7 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Colleges
        </h1>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="colleges" onRetry={retry} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Colleges
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Overview of all colleges and their departments
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {colleges.map((college) => (
          <CollegeCard
            key={college.code}
            college={college}
            onViewDepartments={() => setSelectedCollege(college.code)}
          />
        ))}
      </div>

      <CollegeDepartmentsSheet
        college={selectedCollege}
        collegeData={colleges.find((c) => c.code === selectedCollege) ?? null}
        onClose={() => setSelectedCollege(null)}
      />
    </div>
  );
}
