"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/lib/api";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { ErrorState } from "@/components/state/error-state";
import { HealthStatCards } from "@/components/health/health-stat-cards";
import {
  MemoryUsagePanel,
  DatabaseRecordsPanel,
  ProbeStatusPanel,
} from "@/components/health/health-detail-panels";
import type {
  DatabaseHealth,
  HealthCheckResult,
  LivenessCheck,
  ReadinessCheck,
  SimpleHealth,
} from "@/types";

const AUTO_REFRESH_MS = 30000;

export default function HealthPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  usePageLoadReporter(loading);

  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [simple, setSimple] = useState<SimpleHealth | null>(null);
  const [simpleError, setSimpleError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [health503, setHealth503] = useState(false);
  const [healthDbMessage, setHealthDbMessage] = useState<string | null>(null);
  const [db, setDb] = useState<DatabaseHealth | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [liveness, setLiveness] = useState<LivenessCheck | null>(null);
  const [livenessError, setLivenessError] = useState<string | null>(null);

  const fetchSimple = useCallback(async () => {
    const res = await apiClient.simpleHealthCheck();
    if (res.success && res.data) {
      setSimple(res.data);
      setSimpleError(null);
      return;
    }
    setSimple(null);
    setSimpleError(res.error ?? "Request failed");
  }, []);

  const fetchHealth = useCallback(async () => {
    const res = await apiClient.healthCheck();
    if (res.success && res.data) {
      setHealth(res.data);
      setHealthError(null);
      setHealth503(false);
      setHealthDbMessage(null);
      return;
    }
    setHealth(null);
    setHealthError(res.error ?? "Request failed");
    if (res.statusCode === 503) {
      setHealth503(true);
      setHealthDbMessage(res.error ?? "Database unavailable");
    }
  }, []);

  const fetchDb = useCallback(async () => {
    const res = await apiClient.databaseHealthCheck();
    if (res.success && res.data) {
      if (res.data.status === "ok") {
        setDb(res.data);
        setDbError(null);
      } else {
        setDb(null);
        setDbError(res.data.error ?? "Database connection failed");
      }
      return;
    }
    setDb(null);
    setDbError(res.error ?? "Request failed");
  }, []);

  const fetchReadiness = useCallback(async () => {
    const res = await apiClient.readinessCheck();
    if (res.success && res.data) {
      setReadiness(res.data);
      setReadinessError(null);
      return;
    }
    setReadiness(null);
    setReadinessError(res.error ?? "Request failed");
  }, []);

  const fetchLiveness = useCallback(async () => {
    const res = await apiClient.livenessCheck();
    if (res.success && res.data) {
      setLiveness(res.data);
      setLivenessError(null);
      return;
    }
    setLiveness(null);
    setLivenessError(res.error ?? "Request failed");
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchSimple(),
      fetchHealth(),
      fetchDb(),
      fetchReadiness(),
      fetchLiveness(),
    ]);
    setLastChecked(new Date());
    setSecondsAgo(0);
    setLoading(false);
  }, [fetchSimple, fetchHealth, fetchDb, fetchReadiness, fetchLiveness]);

  const handleRefresh = useCallback(() => {
    fetchAll();
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = setInterval(fetchAll, AUTO_REFRESH_MS);
    }
  }, [fetchAll]);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAll();
    autoRefreshRef.current = setInterval(fetchAll, AUTO_REFRESH_MS);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [isAdmin, fetchAll]);

  useEffect(() => {
    if (!lastChecked) return;
    intervalRef.current = setInterval(() => setSecondsAgo((p) => p + 1), 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lastChecked]);

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Admin only.</p>
      </div>
    );
  }

  const hasAnyData = simple || db || health || readiness || liveness;
  const hasInitialError =
    !hasAnyData && (simpleError || healthError || dbError);

  if (hasInitialError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">System Health</h1>
        <ErrorState entity="health status" onRetry={fetchAll} />
      </div>
    );
  }

  if (loading && !hasAnyData) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">System Health</h1>
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-24 mb-4" />
              <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isDegraded =
    !health || health.info.database.status !== "up" || health503 || !!dbError;

  return (
    <div className="space-y-3 md:space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">System Health</h1>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-gray-500">
            Last checked: {lastChecked ? `${secondsAgo}s ago` : "—"}
          </span>
          <Button
            variant="outline"
            size="default"
            className="h-10"
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      <div
        className={`rounded-xl border p-4 px-5 flex items-center gap-3 ${
          isDegraded
            ? "bg-red-50 border-red-500 border-l-4"
            : "bg-green-50 border-green-700 border-l-4"
        }`}
      >
        {isDegraded ? (
          <>
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" />
            <span className="font-medium text-red-800">
              System degraded — one or more checks failed
            </span>
          </>
        ) : (
          <>
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <span className="font-medium text-green-800">
              All systems operational
            </span>
          </>
        )}
      </div>

      <HealthStatCards
        simple={simple}
        db={db}
        health503={health503}
        healthDbMessage={healthDbMessage}
        dbError={dbError}
        simpleError={simpleError}
        onRetrySimple={fetchSimple}
        onRetryDb={fetchDb}
      />

      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        <MemoryUsagePanel
          info={health?.info}
          healthError={healthError}
          onRetry={fetchHealth}
        />
        <DatabaseRecordsPanel db={db} dbError={dbError} onRetry={fetchDb} />
      </div>

      <ProbeStatusPanel
        readiness={readiness}
        liveness={liveness}
        readinessError={readinessError}
        livenessError={livenessError}
        onRetryReadiness={fetchReadiness}
        onRetryLiveness={fetchLiveness}
      />
    </div>
  );
}
