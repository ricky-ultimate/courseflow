"use client";

import { useCallback, useEffect, useState } from "react";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Course, Semester } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/state/error-state";
import { BookMarked, Download } from "lucide-react";
import { LEVEL_PILL } from "@/lib/constants";

export default function MyCoursesPage() {
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  usePageLoadReporter(loading);

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getLecturerCourses();
      if (res.success && res.data) {
        const data = res.data as { courses?: Course[] };
        setCourses(Array.isArray(data.courses) ? data.courses : []);
      } else {
        setError("Failed to load courses");
      }
    } catch {
      setError("Failed to load courses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleExportCSV = () => {
    if (!courses.length) return;
    const headers = [
      "Code",
      "Name",
      "Level",
      "Semester",
      "Credits",
      "Department",
    ];
    const rows = courses.map((c) => [
      c.code,
      c.name,
      c.level.replace("LEVEL_", "") + " Level",
      c.semester === Semester.FIRST ? "First Semester" : "Second Semester",
      String(c.credits),
      c.department?.name ?? c.departmentCode,
    ]);
    const csv = [headers, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","),
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-courses.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Courses exported." });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Courses
          </h1>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  {[
                    "Code",
                    "Name",
                    "Level",
                    "Semester",
                    "Credits",
                    "Department",
                  ].map((h) => (
                    <th key={h} className="p-3">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} className="border-t">
                    {[80, 200, 70, 110, 40, 120].map((w, j) => (
                      <td key={j} className="p-3">
                        <div
                          className={`h-6 bg-gray-200 animate-pulse rounded`}
                          style={{ width: w }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          My Courses
        </h1>
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="courses" onRetry={fetchCourses} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            My Courses
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Courses you are assigned to teach
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={handleExportCSV}
          disabled={!courses.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 p-12 text-center">
          <BookMarked className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">
            No courses assigned
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            You have not been assigned to any courses yet.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b sticky top-0 z-10">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-3 w-[100px]">Code</th>
                    <th className="p-3">Name</th>
                    <th className="p-3 w-[100px]">Level</th>
                    <th className="p-3 w-[140px]">Semester</th>
                    <th className="p-3 w-[70px] text-center">Credits</th>
                    <th className="p-3">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                          {c.code}
                        </span>
                      </td>
                      <td className="p-3 text-sm">{c.name}</td>
                      <td className="p-3">
                        <Badge
                          variant="secondary"
                          className={LEVEL_PILL[c.level] ?? ""}
                        >
                          {c.level.replace("LEVEL_", "")}L
                        </Badge>
                      </td>
                      <td className="p-3 text-sm">
                        {c.semester === Semester.FIRST ? "First" : "Second"}
                      </td>
                      <td className="p-3 text-sm text-center">{c.credits}</td>
                      <td className="p-3 text-sm">
                        {c.department?.name ?? c.departmentCode}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="md:hidden space-y-3">
            {courses.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {c.code}
                  </span>
                  <Badge
                    variant="secondary"
                    className={LEVEL_PILL[c.level] ?? ""}
                  >
                    {c.level.replace("LEVEL_", "")}L
                  </Badge>
                </div>
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {c.department?.name ?? c.departmentCode} &middot;{" "}
                  {c.semester === Semester.FIRST ? "First" : "Second"} Semester
                  &middot; {c.credits} credits
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
