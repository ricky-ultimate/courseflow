"use client";

import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { College, Department } from "@/types";

export interface CollegeData {
  code: College;
  name: string;
  departments: Department[];
  totalDepartments: number;
  totalCourses: number;
}

const COLLEGE_NAMES: Record<College, string> = {
  [College.CBAS]: "College of Basic & Applied Sciences",
  [College.CHMS]: "College of Humanities & Management Sciences",
  [College.CAHS]: "College of Allied Health Sciences",
};

export function useColleges() {
  const [colleges, setColleges] = useState<CollegeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.getDepartments({ limit: 10000 });
      const result = getItemsFromResponse<Department>(res);
      const departments = result?.items ?? [];

      const grouped: CollegeData[] = (Object.values(College) as College[]).map(
        (code) => {
          const depts = departments.filter((d) => d.college === code);
          const totalCourses = 0;
          return {
            code,
            name: COLLEGE_NAMES[code],
            departments: depts,
            totalDepartments: depts.length,
            totalCourses,
          };
        },
      );

      setColleges(grouped);
    } catch {
      setError("Failed to load colleges");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { colleges, loading, error, retry: fetch };
}
