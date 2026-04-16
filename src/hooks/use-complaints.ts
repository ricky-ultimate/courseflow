"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Complaint, ComplaintStatus } from "@/types";

export function useComplaints(
    activeTab: "all" | ComplaintStatus,
    orderBy: "newest" | "oldest",
) {
    const { isAdmin } = useAuth();
    const { toast } = useToast();

    const [complaints, setComplaints] = useState<Complaint[]>([]);
    const [loading, setLoading] = useState(true);
    const [refetching, setRefetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [pendingCount, setPendingCount] = useState<number | null>(null);
    const hasFetchedRef = useRef(false);

    const fetchComplaints = useCallback(async () => {
        try {
            if (!hasFetchedRef.current) setLoading(true);
            else setRefetching(true);
            setFetchError(null);

            if (isAdmin) {
                const allRes = await apiClient.getComplaints({
                    page: 1,
                    limit: 200,
                    orderBy: "createdAt",
                    orderDirection: orderBy === "newest" ? "desc" : "asc",
                });
                const allR = getItemsFromResponse<Complaint>(allRes);
                const allItems = allR?.items ?? [];
                setPendingCount(
                    allItems.filter((c) => c.status === ComplaintStatus.PENDING).length,
                );
                setComplaints(
                    activeTab === "all"
                        ? allItems
                        : allItems.filter((c) => c.status === activeTab),
                );
            } else {
                const res = await apiClient.getMyComplaints();
                const data = (res as any)?.data;
                setComplaints(Array.isArray(data) ? data : (data?.data ?? []));
            }
        } catch {
            setFetchError("Failed to load complaints");
            toast({ title: "Failed to load complaints", variant: "destructive" });
        } finally {
            setLoading(false);
            setRefetching(false);
            hasFetchedRef.current = true;
        }
    }, [isAdmin, orderBy, activeTab, toast]);

    useEffect(() => {
        fetchComplaints();
    }, [fetchComplaints]);

    return {
        complaints,
        loading,
        refetching,
        fetchError,
        pendingCount,
        refetch: fetchComplaints,
        setFetchError,
    };
}
