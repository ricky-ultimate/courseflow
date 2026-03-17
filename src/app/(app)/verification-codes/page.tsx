"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { VerificationCode, Role, CreateVerificationCodeData } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus, KeyRound, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ErrorState } from "@/components/state/error-state";
import { VerificationCodeTable } from "@/components/verification-codes/verification-code-table";
import { VerificationCodeFormModal } from "@/components/verification-codes/verification-code-form-modal";

const verificationCodeSchema = z.object({
  code: z.string().min(1, "Code is required").max(50, "Code max 50 chars"),
  role: z.nativeEnum(Role),
  description: z.string().max(200).optional(),
  maxUsage: z.string().optional().refine((s) => !s || parseInt(s, 10) >= 1, "Must be 1 or more"),
  expiresAt: z.string().optional(),
});

type VerificationCodeFormValues = z.infer<typeof verificationCodeSchema>;

export default function VerificationCodesPage() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();

  const [codes, setCodes] = useState<VerificationCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [refetching, setRefetching] = useState(false);
  const hasFetchedRef = useRef(false);
  usePageLoadReporter(loading);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<VerificationCode | null>(null);
  const openForEditRef = useRef<string | null>(null);
  const [deleteCode, setDeleteCode] = useState<VerificationCode | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState("");

  const form = useForm<VerificationCodeFormValues>({
    resolver: zodResolver(verificationCodeSchema),
    mode: "onBlur",
    defaultValues: { code: "", role: Role.LECTURER, description: "", maxUsage: "", expiresAt: "" },
  });

  const fetchCodes = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true);
      else setRefetching(true);
      setFetchError(null);
      const res = await apiClient.getVerificationCodes();
      const parsed = getItemsFromResponse<VerificationCode>(res);
      const items = parsed?.items ?? (Array.isArray((res as any)?.data) ? (res as any).data : []);
      setCodes(items);
    } catch {
      setFetchError("Failed to load verification codes");
      toast({ title: "Failed to load verification codes", variant: "destructive" });
    } finally {
      setLoading(false);
      setRefetching(false);
      hasFetchedRef.current = true;
    }
  }, [toast]);

  useEffect(() => { if (isAdmin) fetchCodes(); }, [isAdmin, fetchCodes]);

  const copyToClipboard = async (code: VerificationCode) => {
    try {
      await navigator.clipboard.writeText(code.code);
      setCopiedId(code.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { toast({ title: "Copy failed", variant: "destructive" }); }
  };

  const generateCode = () => {
    const rolePrefix = form.watch("role").toUpperCase();
    const year = new Date().getFullYear();
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let suffix = "";
    for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
    form.setValue("code", `${rolePrefix}-${year}-${suffix}`);
  };

  const closeModal = useCallback(() => {
    openForEditRef.current = null;
    setEditingCode(null);
    setIsModalOpen(false);
  }, []);

  const openCreate = () => {
    openForEditRef.current = null;
    setEditingCode(null);
    setSaveError("");
    form.reset({ code: "", role: Role.LECTURER, description: "", maxUsage: "", expiresAt: "" });
    setIsModalOpen(true);
  };

  const openEdit = async (c: VerificationCode) => {
    openForEditRef.current = c.id;
    setEditingCode(c);
    setSaveError("");
    form.reset({ code: c.code, role: c.role, description: c.description ?? "", maxUsage: c.maxUsage != null ? String(c.maxUsage) : "", expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : "" });
    setIsModalOpen(true);
    try {
      const res = await apiClient.getVerificationCodeById(c.id);
      if (openForEditRef.current !== c.id) return;
      if (res.success && res.data) {
        const fresh = res.data as VerificationCode;
        setEditingCode(fresh);
        form.reset({ code: fresh.code, role: fresh.role, description: fresh.description ?? "", maxUsage: fresh.maxUsage != null ? String(fresh.maxUsage) : "", expiresAt: fresh.expiresAt ? new Date(fresh.expiresAt).toISOString().slice(0, 16) : "" });
      }
    } catch { if (openForEditRef.current === c.id) toast({ title: "Failed to load code", variant: "destructive" }); }
  };

  const handleSave = form.handleSubmit(async (data) => {
    setSaveError("");
    try {
      setSaving(true);
      const payload: CreateVerificationCodeData = {
        code: data.code.trim(), role: data.role, description: data.description?.trim(),
        maxUsage: data.maxUsage && parseInt(data.maxUsage, 10) >= 1 ? parseInt(data.maxUsage, 10) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
      };
      if (editingCode) {
        const res = await apiClient.updateVerificationCode(editingCode.id, payload);
        if (res.success) { toast({ title: "Code updated." }); closeModal(); fetchCodes(); }
        else setSaveError((res as { error?: string }).error ?? "Failed to update");
      } else {
        const res = await apiClient.createVerificationCode(payload);
        if (res.success) { toast({ title: "Code created." }); closeModal(); fetchCodes(); }
        else setSaveError((res as { error?: string }).error ?? "Failed to create");
      }
    } catch { setSaveError("Save failed"); }
    finally { setSaving(false); }
  });

  const handleToggleActive = async (c: VerificationCode) => {
    const prevActive = c.isActive;
    setCodes((prev) => prev.map((x) => x.id === c.id ? { ...x, isActive: !x.isActive } : x));
    try {
      setActionLoading(true);
      const res = await apiClient.updateVerificationCode(c.id, { isActive: !c.isActive });
      if (res.success) { toast({ title: prevActive ? "Code deactivated." : "Code activated." }); }
      else { setCodes((prev) => prev.map((x) => x.id === c.id ? { ...x, isActive: prevActive } : x)); toast({ title: (res as any).error, variant: "destructive" }); }
    } catch { setCodes((prev) => prev.map((x) => x.id === c.id ? { ...x, isActive: prevActive } : x)); toast({ title: "Update failed", variant: "destructive" }); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (): Promise<boolean> => {
    if (!deleteCode) return false;
    try {
      setActionLoading(true);
      const res = await apiClient.deleteVerificationCode(deleteCode.id);
      if (res.success) { toast({ title: "Code deleted." }); setDeleteCode(null); fetchCodes(); return true; }
      toast({ title: (res as any).error, variant: "destructive" });
      return false;
    } catch { toast({ title: "Delete failed", variant: "destructive" }); return false; }
    finally { setActionLoading(false); }
  };

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <KeyRound className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-500">Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Verification Codes</h1>
        <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />New Code</Button>
      </div>

      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="verification codes" onRetry={() => { setFetchError(null); fetchCodes(); }} />
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  {["Code", "Role", "Description", "Usage", "Expires", "Status", "Created By", "Actions"].map((h) => <th key={h} className="p-3">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <tr key={i} className="border-t">
                    {[96, 64, 128, 80, 96, 56, 96, 64].map((w, j) => (
                      <td key={j} className="p-3"><div className={`h-6 bg-gray-200 animate-pulse rounded w-[${w}px]`} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : codes.length === 0 ? (
        <div className="relative rounded-2xl border border-slate-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          <KeyRound className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No verification codes</h3>
          <p className="text-sm text-gray-400 mt-2">Create codes to allow staff registration.</p>
          <Button className="mt-5" onClick={openCreate}><Plus className="h-4 w-4 mr-2" />+ New Code</Button>
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          <VerificationCodeTable codes={codes} copiedId={copiedId} actionLoading={actionLoading} onCopy={copyToClipboard} onEdit={openEdit} onToggleActive={handleToggleActive} onDelete={setDeleteCode} />
        </div>
      )}

      <VerificationCodeFormModal open={isModalOpen} isEdit={!!editingCode} form={form} saving={saving} error={saveError} onClose={closeModal} onSubmit={handleSave} onGenerateCode={generateCode} />
      <ConfirmDialog open={!!deleteCode} onOpenChange={(o) => !o && setDeleteCode(null)} title="Delete verification code?" description="This cannot be undone." icon={Trash2} iconClassName="bg-red-500 text-white" confirmLabel="Delete" confirmVariant="destructive" onConfirm={handleDelete} loading={actionLoading} />
    </div>
  );
}
