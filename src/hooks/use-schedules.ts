"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useActiveSessionInvalidateCount } from "@/contexts/ActiveSessionContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import {
  AcademicSession,
  Course,
  Department,
  DayOfWeek,
  Level,
  Schedule,
  Semester,
} from "@/types";

export function useScheduleData() {
  const activeSessionInvalidateCount = useActiveSessionInvalidateCount();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(
    null,
  );
  const [selectedSessionId, setSelectedSessionId] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptRes, sessRes, activeRes] = await Promise.all([
          apiClient.getDepartments({ limit: 10000 }),
          apiClient.getAcademicSessions({ limit: 10000 }),
          apiClient.getActiveAcademicSession(),
        ]);
        const d = getItemsFromResponse<Department>(deptRes);
        const s = getItemsFromResponse<AcademicSession>(sessRes);
        if (d) setDepartments(d.items);
        if (s) setSessions(s.items);
        if (activeRes.success && activeRes.data) {
          const act = activeRes.data as AcademicSession;
          setActiveSession(act);
          setSelectedSessionId(act.id);
        } else if (s?.items?.length) {
          setSelectedSessionId(s.items[0]!.id);
        }
      } catch (e) {
        console.error("Failed to fetch schedule data:", e);
      }
    };
    fetchData();
  }, [activeSessionInvalidateCount]);

  return {
    departments,
    sessions,
    activeSession,
    selectedSessionId,
    setSelectedSessionId,
  };
}

export interface ScheduleFilters {
  searchTerm: string;
  departmentCode: string;
  level: string;
  day: string;
  semester: string;
  sessionId: string;
  page: number;
  limit: number;
}

export function useSchedules(filters: ScheduleFilters) {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const hasFetchedRef = useRef(false);

  const fetchSchedules = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefetching(true);
      setFetchError(null);

      const params: Record<string, unknown> = {
        page: filters.page,
        limit: filters.limit,
      };
      if (filters.departmentCode && filters.departmentCode !== "all")
        params.departmentCode = filters.departmentCode;
      if (filters.level && filters.level !== "all")
        params.level = filters.level;
      if (filters.day && filters.day !== "all") params.dayOfWeek = filters.day;
      if (filters.semester && filters.semester !== "all")
        params.semester = filters.semester;
      if (filters.sessionId && filters.sessionId !== "all")
        params.sessionId = filters.sessionId;

      const response = await apiClient.getSchedules(params);
      const result = getItemsFromResponse<Schedule>(response);
      if (result) {
        setSchedules(result.items);
        setTotalPages(result.totalPages);
        setTotal(result.total);
      }
    } catch {
      setFetchError("Failed to load schedules");
    } finally {
      setLoading(false);
      setRefetching(false);
      hasFetchedRef.current = true;
    }
  }, [
    filters.page,
    filters.limit,
    filters.departmentCode,
    filters.level,
    filters.day,
    filters.semester,
    filters.sessionId,
  ]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  return {
    schedules,
    loading,
    refetching,
    fetchError,
    totalPages,
    total,
    refetch: fetchSchedules,
    setFetchError,
  };
}
