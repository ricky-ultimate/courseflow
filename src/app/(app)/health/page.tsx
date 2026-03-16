"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import {
  Server,
  Database,
  Clock,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Building2,
  BookOpen,
  Users,
} from "lucide-react";
import { ErrorState } from "@/components/state/error-state";

function formatUptime(seconds: number): string {
  if (!seconds || seconds < 0) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  parts.push(`${m}m`);
  return parts.join(" ");
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "—";
  }
}

function bytesToMb(bytes: number): number {
  return Math.round(bytes / 1024 / 1024);
}

export default function HealthPage() {
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  usePageLoadReporter(loading);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [simple, setSimple] = useState<any>(null);
  const [simpleError, setSimpleError] = useState<string | null>(null);
  const [health, setHealth] = useState<any>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [health503, setHealth503] = useState(false);
  const [healthDbMessage, setHealthDbMessage] = useState<string | null>(null);
  const [db, setDb] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [readiness, setReadiness] = useState<any>(null);
  const [readinessError, setReadinessError] = useState<string | null>(null);
  const [liveness, setLiveness] = useState<any>(null);
  const [livenessError, setLivenessError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setSimpleError(null);
    setHealthError(null);
    setDbError(null);
    setReadinessError(null);
    setLivenessError(null);
    setHealth503(false);
    setHealthDbMessage(null);

    const results = await Promise.allSettled([
      apiClient.simpleHealthCheck(),
      apiClient.healthCheck(),
      apiClient.databaseHealthCheck(),
      apiClient.readinessCheck(),
      apiClient.livenessCheck(),
    ]);

    const [s, h, d, r, l] = results;

    if (s.status === "fulfilled") {
      if (s.value.success) setSimple(s.value.data);
      else setSimpleError("Request failed");
    } else setSimpleError("Failed to fetch");

    if (h.status === "fulfilled") {
      const res = h.value as any;
      if (res.statusCode === 503) {
        setHealth503(true);
        setHealthDbMessage(res.error?.database?.message ?? "Database unavailable");
      }
      if (res.success && res.data) setHealth(res.data);
      else if (!res.success) setHealthError(res.error?.database?.message ?? "Request failed");
    } else setHealthError("Failed to fetch");

    if (d.status === "fulfilled") {
      if (d.value.success) setDb(d.value.data);
      else setDbError((d.value as any).error?.database?.message ?? "Request failed");
    } else setDbError("Failed to fetch");

    if (r.status === "fulfilled") {
      if (r.value.success) setReadiness(r.value.data);
      else setReadinessError("Request failed");
    } else setReadinessError("Failed to fetch");

    if (l.status === "fulfilled") {
      if (l.value.success) setLiveness(l.value.data);
      else setLivenessError("Request failed");
    } else setLivenessError("Failed to fetch");

    setLastChecked(new Date());
    setSecondsAgo(0);
    setLoading(false);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchAll();
    if (autoRefreshRef.current) {
      clearInterval(autoRefreshRef.current);
      autoRefreshRef.current = setInterval(fetchAll, 30000);
    }
  }, [fetchAll]);

  const fetchSimple = useCallback(async () => {
    setSimpleError(null);
    try {
      const s = await apiClient.simpleHealthCheck();
      if (s.success) setSimple(s.data);
      else setSimpleError("Request failed");
    } catch {
      setSimpleError("Failed to fetch");
    }
  }, []);

  const fetchDb = useCallback(async () => {
    setDbError(null);
    setHealth503(false);
    try {
      const d = await apiClient.databaseHealthCheck();
      if (d.success) setDb(d.data);
      else setDbError((d as any).error?.database?.message ?? "Request failed");
    } catch {
      setDbError("Failed to fetch");
    }
  }, []);

  const fetchHealth = useCallback(async () => {
    setHealthError(null);
    try {
      const h = await apiClient.healthCheck();
      const res = h as any;
      if (res.statusCode === 503) setHealth503(true);
      if (res.success && res.data) setHealth(res.data);
      else setHealthError(res.error?.database?.message ?? "Request failed");
    } catch {
      setHealthError("Failed to fetch");
    }
  }, []);

  const fetchReadiness = useCallback(async () => {
    setReadinessError(null);
    try {
      const r = await apiClient.readinessCheck();
      if (r.success) setReadiness(r.data);
      else setReadinessError("Request failed");
    } catch {
      setReadinessError("Failed to fetch");
    }
  }, []);

  const fetchLiveness = useCallback(async () => {
    setLivenessError(null);
    try {
      const l = await apiClient.livenessCheck();
      if (l.success) setLiveness(l.data);
      else setLivenessError("Request failed");
    } catch {
      setLivenessError("Failed to fetch");
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    fetchAll();
    autoRefreshRef.current = setInterval(fetchAll, 30000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, [isAdmin, fetchAll]);

  useEffect(() => {
    if (!lastChecked) return;
    intervalRef.current = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [lastChecked]);

  const isDegraded =
    !health ||
    (health as any).success === false ||
    (health as any).info?.database?.status !== "up" ||
    (health as any).info?.memory?.heap?.status === "down" ||
    (health as any).info?.memory?.rss?.status === "down" ||
    health503 ||
    dbError;

  const hasAnyData = simple || db || health || readiness || liveness;
  const hasInitialError = !hasAnyData && (simpleError || healthError || dbError);

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Admin only.</p>
      </div>
    );
  }

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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-bold">System Health</h1>
        </div>
        <div className="grid gap-3 md:grid-cols-3 md:gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-24" />
                <div className="h-10 w-10 bg-gray-200 rounded-full" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const info = (health as any)?.info;
  const memHeap = info?.memory?.heap ?? info?.heap;
  const memRss = info?.memory?.rss ?? info?.rss;
  const tables = db?.database?.tables ?? db?.tables;

  return (
    <div className="space-y-3 md:space-y-6 mt-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold">System Health</h1>
        <div className="flex items-center gap-4">
          <span className="text-[13px] text-gray-500">
            Last checked: {lastChecked ? `${secondsAgo}s ago` : "—"}
          </span>
          <Button variant="outline" size="default" className="h-10" onClick={handleRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
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
            <span className="font-medium text-red-800">System degraded — one or more checks failed</span>
          </>
        ) : (
          <>
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <span className="font-medium text-green-800">All systems operational</span>
          </>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid gap-3 md:grid-cols-3 md:gap-4">
        {/* Application */}
        <Card className={simpleError ? "border-red-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Application</CardTitle>
            <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center">
              <Server className="h-5 w-5 text-sky-600" />
            </div>
          </CardHeader>
          <CardContent>
            {simpleError ? (
              <>
                <p className="text-2xl font-bold text-red-600">Offline</p>
                <button
                  onClick={fetchSimple}
                  className="text-[13px] text-indigo-600 hover:underline mt-1"
                >
                  Failed to fetch — Retry
                </button>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-green-600">
                  {simple ? "Online" : "—"}
                </p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {simple?.environment && (
                    <Badge
                      variant="secondary"
                      className={
                        simple.environment === "production"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-amber-100 text-amber-700"
                      }
                    >
                      {simple.environment}
                    </Badge>
                  )}
                  <span className="text-[13px] text-gray-500">{simple?.version ?? "—"}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Database */}
        <Card
          className={
            health503 || dbError
              ? "bg-red-50 border-red-500 border-l-4"
              : dbError
              ? "border-red-200"
              : ""
          }
        >
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center">
              <Database className="h-5 w-5 text-violet-600" />
            </div>
          </CardHeader>
          <CardContent>
            {dbError || health503 ? (
              <>
                <p className="text-2xl font-bold text-red-600">Disconnected</p>
                {(dbError || healthDbMessage) && (
                  <p className="text-[13px] text-red-600 mt-1">
                    {healthDbMessage ?? dbError}
                  </p>
                )}
                <button
                  onClick={fetchDb}
                  className="text-[13px] text-indigo-600 hover:underline mt-1 block"
                >
                  Failed to fetch — Retry
                </button>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold text-green-600">
                  {db?.database?.connected !== false ? "Connected" : "Disconnected"}
                </p>
                <p className="text-[13px] text-gray-500 mt-1">
                  {db?.database?.responseTime != null ? `${db.database.responseTime}ms` : "—"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card className={simpleError ? "border-red-200" : ""}>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Clock className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            {simpleError ? (
              <>
                <p className="text-2xl font-bold">—</p>
                <button
                  onClick={fetchSimple}
                  className="text-[13px] text-indigo-600 hover:underline mt-1"
                >
                  Failed to fetch — Retry
                </button>
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">
                  {simple?.uptime != null ? formatUptime(simple.uptime) : "—"}
                </p>
                <p className="text-[13px] text-gray-500 mt-1">
                  Since{" "}
                  {simple?.uptime
                    ? formatTimestamp(new Date(Date.now() - simple.uptime * 1000).toISOString())
                    : "—"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Panels */}
      <div className="grid gap-3 md:grid-cols-2 md:gap-4">
        {/* Memory Usage */}
        <Card className="rounded-xl border p-5">
          <h3 className="text-base font-semibold mb-4">Memory Usage</h3>
          {healthError && !info ? (
            <button onClick={fetchHealth} className="text-[13px] text-indigo-600 hover:underline">
              Failed to fetch — Retry
            </button>
          ) : (
            <div className="space-y-4">
              {/* Heap */}
              <div>
                <p className="text-sm font-medium mb-1">Heap Memory</p>
                {memHeap ? (
                  <>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          (memHeap.used / (memHeap.limit || 1)) * 100 < 70
                            ? "bg-green-500"
                            : (memHeap.used / (memHeap.limit || 1)) * 100 < 90
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(100, ((memHeap.used || 0) / (memHeap.limit || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <Badge
                        variant="secondary"
                        className={
                          (memHeap.used / (memHeap.limit || 1)) * 100 < 70
                            ? "bg-green-100 text-green-700"
                            : (memHeap.used / (memHeap.limit || 1)) * 100 < 90
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {(memHeap.used / (memHeap.limit || 1)) * 100 < 70
                          ? "Healthy"
                          : (memHeap.used / (memHeap.limit || 1)) * 100 < 90
                          ? "Warning"
                          : "Critical"}
                      </Badge>
                      <span className="text-[13px] text-gray-500">
                        {bytesToMb(memHeap.used || 0)} / {bytesToMb(memHeap.limit || 0)} MB
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[13px] text-gray-500">—</span>
                )}
              </div>
              {/* RSS */}
              <div>
                <p className="text-sm font-medium mb-1">RSS Memory</p>
                {memRss ? (
                  <>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          (memRss.used / (memRss.limit || 1)) * 100 < 70
                            ? "bg-green-500"
                            : (memRss.used / (memRss.limit || 1)) * 100 < 90
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                        style={{
                          width: `${Math.min(100, ((memRss.used || 0) / (memRss.limit || 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <Badge
                        variant="secondary"
                        className={
                          (memRss.used / (memRss.limit || 1)) * 100 < 70
                            ? "bg-green-100 text-green-700"
                            : (memRss.used / (memRss.limit || 1)) * 100 < 90
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                        }
                      >
                        {(memRss.used / (memRss.limit || 1)) * 100 < 70
                          ? "Healthy"
                          : (memRss.used / (memRss.limit || 1)) * 100 < 90
                          ? "Warning"
                          : "Critical"}
                      </Badge>
                      <span className="text-[13px] text-gray-500">
                        {bytesToMb(memRss.used || 0)} / {bytesToMb(memRss.limit || 0)} MB
                      </span>
                    </div>
                  </>
                ) : (
                  <span className="text-[13px] text-gray-500">—</span>
                )}
              </div>
            </div>
          )}
        </Card>

        {/* Database Tables */}
        <Card className="rounded-xl border p-5">
          <h3 className="text-base font-semibold mb-4">Database Records</h3>
          {dbError && !tables ? (
            <button onClick={fetchDb} className="text-[13px] text-indigo-600 hover:underline">
              Failed to fetch — Retry
            </button>
          ) : tables ? (
            <div className="space-y-3">
              {[
                { icon: Building2, label: "Departments", key: "departments" },
                { icon: BookOpen, label: "Courses", key: "courses" },
                { icon: Clock, label: "Schedules", key: "schedules" },
                { icon: Users, label: "Users", key: "users" },
              ].map(({ icon: Icon, label, key }) => (
                <div key={key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-gray-500" />
                    <span className="text-sm">{label}</span>
                  </div>
                  <span className="text-sm font-bold bg-gray-200 px-2 py-0.5 rounded">
                    {tables[key] ?? "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-[13px] text-gray-500">—</span>
          )}
        </Card>
      </div>

      {/* Probe Status - full width */}
      <Card className="rounded-xl border p-5">
        <h3 className="text-base font-semibold mb-4">Probe Status</h3>
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Readiness</p>
            {readinessError ? (
              <button onClick={fetchReadiness} className="text-[13px] text-indigo-600 hover:underline">
                Failed to fetch — Retry
              </button>
            ) : (
              <>
                <Badge
                  className={
                    readiness?.status === "ready"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {readiness?.status === "ready" ? "Ready" : "Not Ready"}
                </Badge>
                <p className="text-[13px] text-gray-500 mt-1">Application is ready to serve traffic.</p>
              </>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Liveness</p>
            {livenessError ? (
              <button onClick={fetchLiveness} className="text-[13px] text-indigo-600 hover:underline">
                Failed to fetch — Retry
              </button>
            ) : (
              <>
                <Badge
                  className={
                    liveness?.status === "alive"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }
                >
                  {liveness?.status === "alive" ? "Alive" : "Dead"}
                </Badge>
                <p className="text-[13px] text-gray-500 mt-1">Application process is running.</p>
                {liveness?.timestamp && (
                  <p className="text-[13px] text-gray-500 mt-0.5">
                    {formatTimestamp(liveness.timestamp)}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
