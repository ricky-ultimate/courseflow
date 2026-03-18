"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Database, Server } from "lucide-react";

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
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  } catch { return "—"; }
}

interface HealthStatCardsProps {
  simple: any;
  db: any;
  health503: boolean;
  healthDbMessage: string | null;
  dbError: string | null;
  simpleError: string | null;
  onRetrySimple: () => void;
  onRetryDb: () => void;
}

export function HealthStatCards({
  simple, db, health503, healthDbMessage, dbError, simpleError,
  onRetrySimple, onRetryDb,
}: HealthStatCardsProps) {
  return (
    <div className="grid gap-3 md:grid-cols-3 md:gap-4">
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
              <button onClick={onRetrySimple} className="text-[13px] text-indigo-600 hover:underline mt-1">
                Failed to fetch — Retry
              </button>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-green-600">{simple ? "Online" : "—"}</p>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {simple?.environment && (
                  <Badge variant="secondary" className={
                    simple.environment === "production"
                      ? "bg-indigo-100 text-indigo-700"
                      : "bg-amber-100 text-amber-700"
                  }>
                    {simple.environment}
                  </Badge>
                )}
                <span className="text-[13px] text-gray-500">{simple?.version ?? "—"}</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className={
        health503 || dbError
          ? "bg-red-50 border-red-500 border-l-4"
          : ""
      }>
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
                <p className="text-[13px] text-red-600 mt-1">{healthDbMessage ?? dbError}</p>
              )}
              <button onClick={onRetryDb} className="text-[13px] text-indigo-600 hover:underline mt-1 block">
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
              <button onClick={onRetrySimple} className="text-[13px] text-indigo-600 hover:underline mt-1">
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
  );
}
