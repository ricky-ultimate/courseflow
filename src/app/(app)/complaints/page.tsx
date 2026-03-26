"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { useToast } from "@/hooks/use-toast";
import { useComplaints } from "@/hooks/use-complaints";
import { apiClient } from "@/lib/api";
import { Complaint, ComplaintStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { RefetchIndicator } from "@/components/ui/refetch-indicator";
import { ErrorState } from "@/components/state/error-state";
import { FilterBar } from "@/components/ui/filter-bar";
import { FilterSelect } from "@/components/ui/filter-select";
import { SelectItem } from "@/components/ui/select";
import { MessageSquareWarning, Plus } from "lucide-react";
import { ComplaintsManagerTabs } from "@/components/complaints/complaints-manager-tabs";
import { ComplaintsManagerTable } from "@/components/complaints/complaints-manager-table";
import { ComplaintsUserList } from "@/components/complaints/complaints-user-list";
import { ComplaintSubmitDialog } from "@/components/complaints/complaint-submit-dialog";
import { ComplaintDetailDialog } from "@/components/complaints/complaint-detail-dialog";

export default function ComplaintsPage() {
  const { isAdmin, isHod } = useAuth();
  const { toast } = useToast();
  const isManager = isAdmin || isHod;

  const [activeTab, setActiveTab] = useState<"all" | ComplaintStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [orderBy, setOrderBy] = useState<"newest" | "oldest">("newest");
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null);
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const {
    complaints,
    loading,
    refetching,
    fetchError,
    pendingCount,
    refetch,
    setFetchError,
  } = useComplaints(activeTab, orderBy);

  usePageLoadReporter(loading);

  const filteredComplaints = complaints
    .filter((c) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return (
        (c.subject ?? "").toLowerCase().includes(term) ||
        (c.name ?? "").toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return orderBy === "newest" ? tb - ta : ta - tb;
    });

  const handleStatusChange = async (id: string, status: ComplaintStatus) => {
    try {
      setStatusLoading(id);
      const res = await apiClient.updateComplaintStatus(id, status);
      if (res.success) {
        const label = status
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
        toast({ title: `Complaint status updated to ${label}.` });
        setDetailComplaint((c) => (c?.id === id ? { ...c, status } : c));
        refetch();
      } else {
        toast({ title: (res as any).error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setStatusLoading(null);
    }
  };

  if (!isManager) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">My Complaints</h1>
          <Button size="sm" onClick={() => setIsSubmitOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Submit Complaint
          </Button>
        </div>

        {fetchError ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <ErrorState
              entity="complaints"
              onRetry={() => {
                setFetchError(null);
                refetch();
              }}
            />
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <ComplaintsUserList
            complaints={complaints}
            refetching={refetching}
            onView={setDetailComplaint}
            onSubmitClick={() => setIsSubmitOpen(true)}
          />
        )}

        <ComplaintSubmitDialog
          open={isSubmitOpen}
          onOpenChange={setIsSubmitOpen}
          onSuccess={refetch}
        />
        <ComplaintDetailDialog
          complaint={detailComplaint}
          isAdmin={!!isAdmin}
          statusLoading={statusLoading}
          onClose={() => setDetailComplaint(null)}
          onStatusChange={handleStatusChange}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Complaints</h1>

      <ComplaintsManagerTabs
        activeTab={activeTab}
        pendingCount={pendingCount}
        onTabChange={setActiveTab}
      />

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search by subject or name..."
      >
        <FilterSelect
          value={orderBy}
          onValueChange={(v) => setOrderBy(v as "newest" | "oldest")}
          width="w-[140px]"
        >
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
        </FilterSelect>
      </FilterBar>

      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState
            entity="complaints"
            onRetry={() => {
              setFetchError(null);
              refetch();
            }}
          />
        </div>
      ) : loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  {["#", "Name", "Department", "Subject", "Status", "Created", "Actions"].map(
                    (h) => (
                      <th key={h} className="p-3">
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <tr key={i} className="border-t">
                    {[6, 28, 24, 40, 20, 24, 16].map((w, j) => (
                      <td key={j} className="p-3">
                        <div className={`h-6 bg-gray-200 animate-pulse rounded w-${w}`} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="relative rounded-xl border border-gray-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          <MessageSquareWarning className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No complaints</h3>
          <p className="text-sm text-gray-400 mt-2">
            No complaints match the current filter.
          </p>
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          <ComplaintsManagerTable
            complaints={filteredComplaints}
            statusLoading={statusLoading}
            onView={setDetailComplaint}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      <ComplaintDetailDialog
        complaint={detailComplaint}
        isAdmin={!!isAdmin}
        statusLoading={statusLoading}
        onClose={() => setDetailComplaint(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
}
