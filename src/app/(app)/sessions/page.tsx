"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { useActiveSessionInvalidate } from "@/contexts/ActiveSessionContext";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { apiClient } from "@/lib/api";
import { AcademicSession, SessionStatistics } from "@/types";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { BarChart2, CalendarDays, Pencil, Archive, Trash2 } from "lucide-react";
import { getItemsFromResponse } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/state/error-state";
import { SessionCard } from "@/components/sessions/session-card";
import { SessionFormModal } from "@/components/sessions/session-form-modal";
import { SessionStatsModal } from "@/components/sessions/session-stats-modal";

const sessionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
}).refine((d) => new Date(d.endDate) > new Date(d.startDate), { message: "End date must be after start date", path: ["endDate"] });

type SessionFormValues = z.infer<typeof sessionSchema>;

export default function AcademicSessionsPage() {
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();
  const invalidateActiveSession = useActiveSessionInvalidate();

  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(null);
  const [sessionStats, setSessionStats] = useState<Record<string, SessionStatistics>>({});
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const hasFetchedRef = useRef(false);
  usePageLoadReporter(loading);
  const [submitting, setSubmitting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editSession, setEditSession] = useState<AcademicSession | null>(null);
  const openForEditRef = useRef<string | null>(null);
  const [statsSession, setStatsSession] = useState<AcademicSession | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsData, setStatsData] = useState<SessionStatistics | null>(null);
  const [confirmState, setConfirmState] = useState<{ open: boolean; action: "activate" | "archive" | "delete"; session: AcademicSession | null }>({ open: false, action: "activate", session: null });
  const [actionLoading, setActionLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [mobileSheetSession, setMobileSheetSession] = useState<AcademicSession | null>(null);
  const [createError, setCreateError] = useState("");
  const [editError, setEditError] = useState("");

  const createForm = useForm<SessionFormValues>({ resolver: zodResolver(sessionSchema), mode: "onBlur", defaultValues: { name: "", startDate: "", endDate: "" } });
  const editForm = useForm<SessionFormValues>({ resolver: zodResolver(sessionSchema), mode: "onBlur", defaultValues: { name: "", startDate: "", endDate: "" } });

  const fetchSessions = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefetching(true);
      setFetchError(null);
      const [listRes, activeRes] = await Promise.all([apiClient.getAcademicSessions({ page: 1, limit: 50 }), apiClient.getActiveAcademicSession()]);
      const listResult = getItemsFromResponse<AcademicSession>(listRes);
      const items = (listResult?.items ?? []) as AcademicSession[];
      setSessions(items);
      if (activeRes.success && activeRes.data != null) setActiveSession(activeRes.data as AcademicSession);
      else setActiveSession(null);
      const stats: Record<string, SessionStatistics> = {};
      await Promise.all(items.map(async (s) => {
        try {
          const res = await apiClient.getSessionStatistics(s.id);
          if (res.success && res.data) stats[s.id] = res.data as SessionStatistics;
        } catch { }
      }));
      setSessionStats(stats);
    } catch {
      setFetchError("Failed to load academic sessions");
      toast({ title: "Failed to load academic sessions", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefetching(false);
      hasFetchedRef.current = true;
    }
  }, [toast]);

  useEffect(() => { if (isAuthenticated && isAdmin) fetchSessions(); }, [isAuthenticated, isAdmin, fetchSessions]);

  const handleCreate = createForm.handleSubmit(async (data) => {
    setCreateError("");
    try {
      setSubmitting(true);
      const res = await apiClient.createAcademicSession({ name: data.name, startDate: new Date(data.startDate).toISOString().split("T")[0]!, endDate: new Date(data.endDate).toISOString().split("T")[0]! });
      if (res.success) { toast({ title: "Session created." }); setIsCreateOpen(false); createForm.reset(); fetchSessions(); }
      else setCreateError((res as { error?: string }).error || "Failed to create");
    } catch { setCreateError("Failed to create session"); }
    finally { setSubmitting(false); }
  });

  const openEditSession = useCallback(async (s: AcademicSession) => {
    openForEditRef.current = s.id;
    setEditSession(s);
    setEditError("");
    editForm.reset({ name: s.name, startDate: s.startDate.split("T")[0]!, endDate: s.endDate.split("T")[0]! });
    try {
      const res = await apiClient.getAcademicSessionById(s.id);
      if (openForEditRef.current !== s.id) return;
      if (res.success && res.data) {
        const fresh = res.data as AcademicSession;
        setEditSession(fresh);
        editForm.reset({ name: fresh.name, startDate: fresh.startDate.split("T")[0]!, endDate: fresh.endDate.split("T")[0]! });
      }
    } catch { if (openForEditRef.current === s.id) toast({ title: "Failed to load session", variant: "destructive" }); }
  }, [editForm, toast]);

  const handleEdit = editForm.handleSubmit(async (data) => {
    if (!editSession) return;
    setEditError("");
    try {
      setSubmitting(true);
      const res = await apiClient.updateAcademicSession(editSession.id, { name: data.name, startDate: new Date(data.startDate).toISOString().split("T")[0]!, endDate: new Date(data.endDate).toISOString().split("T")[0]! });
      if (res.success) { toast({ title: "Session updated." }); openForEditRef.current = null; setEditSession(null); fetchSessions(); }
      else setEditError((res as { error?: string }).error || "Failed to update");
    } catch { setEditError("Failed to update"); }
    finally { setSubmitting(false); }
  });

  const openStatsModal = async (session: AcademicSession) => {
    setStatsSession(session);
    setStatsData(null);
    setStatsLoading(true);
    try {
      const res = await apiClient.getSessionStatistics(session.id);
      if (res.success && res.data) setStatsData(res.data as SessionStatistics);
    } catch { toast({ title: "Failed to load statistics", variant: "destructive" }); }
    finally { setStatsLoading(false); }
  };

  const handleConfirmAction = async (): Promise<boolean> => {
    const { session, action } = confirmState;
    if (!session) return false;
    try {
      setActionLoading(true);
      let res: { success?: boolean };
      if (action === "activate") res = await apiClient.activateAcademicSession(session.id);
      else if (action === "archive") res = await apiClient.archiveAcademicSession(session.id);
      else res = await apiClient.deleteAcademicSession(session.id);
      if (res.success) {
        if (action === "activate") toast({ title: `${session.name} is now the active session.` });
        else if (action === "archive") toast({ title: "Session archived.", variant: "info" });
        else toast({ title: "Session deleted." });
        fetchSessions();
        if (action === "activate" || action === "archive") invalidateActiveSession();
        return true;
      }
      toast({ title: (res as any).error || "Action failed", variant: "destructive" });
      return false;
    } catch { toast({ title: "Action failed", variant: "destructive" }); return false; }
    finally { setActionLoading(false); }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-semibold mb-4">Access Denied</h1>
        <p className="text-gray-500">You need admin privileges to manage academic sessions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Academic Sessions</h1>
        </div>
        <Button size="default" className="h-10 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full" onClick={() => setIsCreateOpen(true)}>
          + New Session
        </Button>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="academic sessions" onRetry={() => { setFetchError(null); fetchSessions(); }} />
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2"><div className="h-6 bg-gray-200 rounded w-16" /><div className="h-7 bg-gray-200 rounded w-40" /></div>
                <div className="h-4 bg-gray-200 rounded w-48" />
              </div>
              <div className="h-9 bg-gray-200 rounded w-24 shrink-0" />
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="relative rounded-xl border border-gray-200 p-8 text-center">
          {refetching && <RefetchIndicator />}
          <CalendarDays className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No academic sessions have been created yet.</p>
          <Button className="mt-4" onClick={() => setIsCreateOpen(true)}>+ New Session</Button>
        </div>
      ) : (
        <div className="relative space-y-3">
          {refetching && <RefetchIndicator />}
          {sessions.map((session) => {
            const isActive = activeSession?.id === session.id || session.isActive;
            return (
              <SessionCard
                key={session.id}
                session={session}
                isActive={isActive}
                stats={sessionStats[session.id]}
                actionLoading={actionLoading}
                onActivate={(s) => setConfirmState({ open: true, action: "activate", session: s })}
                onArchive={(s) => setConfirmState({ open: true, action: "archive", session: s })}
                onEdit={openEditSession}
                onStats={openStatsModal}
                onDelete={(s) => setConfirmState({ open: true, action: "delete", session: s })}
                onMobileMenu={(s) => setMobileSheetSession(s)}
              />
            );
          })}
        </div>
      )}

      <Sheet open={!!mobileSheetSession} onOpenChange={(o) => !o && setMobileSheetSession(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader><SheetTitle>{mobileSheetSession?.name ?? "Session actions"}</SheetTitle></SheetHeader>
          <div className="flex flex-col gap-1 py-4">
            {mobileSheetSession && (() => {
              const s = mobileSheetSession;
              const isActive = activeSession?.id === s.id || s.isActive;
              const close = () => setMobileSheetSession(null);
              return (
                <>
                  {!isActive && <button type="button" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[44px] font-medium text-indigo-600" onClick={() => { setConfirmState({ open: true, action: "activate", session: s }); close(); }}>Activate</button>}
                  {isActive && <button type="button" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[44px] font-medium" onClick={() => { setConfirmState({ open: true, action: "archive", session: s }); close(); }}>Archive</button>}
                  <button type="button" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[44px] font-medium" onClick={() => { openStatsModal(s); close(); }}><BarChart2 className="h-5 w-5" />Statistics</button>
                  <button type="button" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[44px] font-medium" onClick={() => { openEditSession(s); close(); }}><Pencil className="h-5 w-5" />Edit</button>
                  <button type="button" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-left w-full min-h-[44px] font-medium" onClick={() => { setConfirmState({ open: true, action: "delete", session: s }); close(); }}><Trash2 className="h-5 w-5" />Delete</button>
                </>
              );
            })()}
          </div>
        </SheetContent>
      </Sheet>

      <SessionFormModal open={isCreateOpen} onOpenChange={(o) => { if (!o) setCreateError(""); setIsCreateOpen(o); }} title="Create Academic Session" description="Define the academic year and its start/end dates." form={createForm} onSubmit={handleCreate} submitting={submitting} error={createError} submitLabel="Create Session" />
      <SessionFormModal open={!!editSession} onOpenChange={(o) => { if (!o) { openForEditRef.current = null; setEditSession(null); } }} title="Edit Session" description="Update the academic session details." form={editForm} onSubmit={handleEdit} submitting={submitting} error={editError} submitLabel="Save Changes" />
      <SessionStatsModal session={statsSession} stats={statsData} loading={statsLoading} onClose={() => setStatsSession(null)} />

      <ConfirmDialog open={confirmState.open && confirmState.action === "activate"} onOpenChange={(o) => !o && setConfirmState({ open: false, action: "activate", session: null })} title="Activate session?" description={`Make "${confirmState.session?.name}" the active academic session?`} icon={CalendarDays} confirmLabel="Activate" onConfirm={handleConfirmAction} loading={actionLoading} />
      <ConfirmDialog open={confirmState.open && confirmState.action === "archive"} onOpenChange={(o) => !o && setConfirmState({ open: false, action: "archive", session: null })} title="Archive session?" description="This will archive the session. You can activate it again later." icon={Archive} iconClassName="bg-amber-500 text-white" confirmLabel="Archive" confirmClassName="bg-amber-600 hover:bg-amber-700 text-white" onConfirm={handleConfirmAction} loading={actionLoading} />
      <ConfirmDialog open={confirmState.open && confirmState.action === "delete"} onOpenChange={(o) => !o && setConfirmState({ open: false, action: "delete", session: null })} title="Delete session?" description={`This will permanently delete "${confirmState.session?.name}". Sessions with linked schedules or exams cannot be deleted.`} icon={Trash2} iconClassName="bg-red-500 text-white" confirmLabel="Delete" confirmVariant="destructive" onConfirm={handleConfirmAction} loading={actionLoading} />
    </div>
  );
}
