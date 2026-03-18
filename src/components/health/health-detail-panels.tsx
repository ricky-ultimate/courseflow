"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Building2, BookOpen, Clock, Users } from "lucide-react";

function bytesToMb(bytes: number): number {
  return Math.round(bytes / 1024 / 1024);
}

function MemBar({ used, limit }: { used: number; limit: number }) {
  const pct = limit ? (used / limit) * 100 : 0;
  const color =
    pct < 70 ? "bg-green-500" : pct < 90 ? "bg-amber-500" : "bg-red-500";
  const label = pct < 70 ? "Healthy" : pct < 90 ? "Warning" : "Critical";
  const badgeColor =
    pct < 70
      ? "bg-green-100 text-green-700"
      : pct < 90
      ? "bg-amber-100 text-amber-700"
      : "bg-red-100 text-red-700";

  return (
    <>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all ${color}`}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="flex justify-between items-center mt-1">
        <Badge variant="secondary" className={badgeColor}>{label}</Badge>
        <span className="text-[13px] text-gray-500">
          {bytesToMb(used)} / {bytesToMb(limit)} MB
        </span>
      </div>
    </>
  );
}

interface MemoryPanelProps {
  info: any;
  healthError: string | null;
  onRetry: () => void;
}

export function MemoryUsagePanel({ info, healthError, onRetry }: MemoryPanelProps) {
  const memHeap = info?.memory?.heap ?? info?.heap;
  const memRss = info?.memory?.rss ?? info?.rss;

  return (
    <Card className="rounded-xl border p-5">
      <h3 className="text-base font-semibold mb-4">Memory Usage</h3>
      {healthError && !info ? (
        <button onClick={onRetry} className="text-[13px] text-indigo-600 hover:underline">
          Failed to fetch — Retry
        </button>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-1">Heap Memory</p>
            {memHeap ? (
              <MemBar used={memHeap.used || 0} limit={memHeap.limit || 1} />
            ) : (
              <span className="text-[13px] text-gray-500">—</span>
            )}
          </div>
          <div>
            <p className="text-sm font-medium mb-1">RSS Memory</p>
            {memRss ? (
              <MemBar used={memRss.used || 0} limit={memRss.limit || 1} />
            ) : (
              <span className="text-[13px] text-gray-500">—</span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

interface DatabaseRecordsPanelProps {
  db: any;
  dbError: string | null;
  onRetry: () => void;
}

export function DatabaseRecordsPanel({ db, dbError, onRetry }: DatabaseRecordsPanelProps) {
  const tables = db?.database?.tables ?? db?.tables;

  return (
    <Card className="rounded-xl border p-5">
      <h3 className="text-base font-semibold mb-4">Database Records</h3>
      {dbError && !tables ? (
        <button onClick={onRetry} className="text-[13px] text-indigo-600 hover:underline">
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
  );
}

interface ProbeStatusPanelProps {
  readiness: any;
  liveness: any;
  readinessError: string | null;
  livenessError: string | null;
  onRetryReadiness: () => void;
  onRetryLiveness: () => void;
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return "—"; }
}

export function ProbeStatusPanel({
  readiness, liveness, readinessError, livenessError,
  onRetryReadiness, onRetryLiveness,
}: ProbeStatusPanelProps) {
  return (
    <Card className="rounded-xl border p-5">
      <h3 className="text-base font-semibold mb-4">Probe Status</h3>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Readiness</p>
          {readinessError ? (
            <button onClick={onRetryReadiness} className="text-[13px] text-indigo-600 hover:underline">
              Failed to fetch — Retry
            </button>
          ) : (
            <>
              <Badge className={
                readiness?.status === "ready"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }>
                {readiness?.status === "ready" ? "Ready" : "Not Ready"}
              </Badge>
              <p className="text-[13px] text-gray-500 mt-1">
                Application is ready to serve traffic.
              </p>
            </>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium mb-1">Liveness</p>
          {livenessError ? (
            <button onClick={onRetryLiveness} className="text-[13px] text-indigo-600 hover:underline">
              Failed to fetch — Retry
            </button>
          ) : (
            <>
              <Badge className={
                liveness?.status === "alive"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }>
                {liveness?.status === "alive" ? "Alive" : "Dead"}
              </Badge>
              <p className="text-[13px] text-gray-500 mt-1">
                Application process is running.
              </p>
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
  );
}
