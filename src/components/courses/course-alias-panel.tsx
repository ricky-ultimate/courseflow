"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CourseAlias } from "@/types";
import { Link2, Plus, Trash2, Loader2 } from "lucide-react";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";

interface CourseAliasPanelProps {
  courseCode: string;
  canEdit: boolean;
}

export function CourseAliasPanel({
  courseCode,
  canEdit,
}: CourseAliasPanelProps) {
  const { toast } = useToast();
  const [aliases, setAliases] = useState<CourseAlias[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [addError, setAddError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAliases = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.getCourseAliasesForCourse(courseCode);
      if (res.success && Array.isArray(res.data)) {
        setAliases(res.data as CourseAlias[]);
      } else if (res.success && (res.data as any)?.data) {
        setAliases((res.data as any).data as CourseAlias[]);
      } else {
        setAliases([]);
      }
    } catch {
      setAliases([]);
    } finally {
      setLoading(false);
    }
  }, [courseCode]);

  useEffect(() => {
    fetchAliases();
  }, [fetchAliases]);

  const handleAdd = async () => {
    const trimmed = newCode.trim().toUpperCase();
    if (!trimmed) return;
    setAddError("");
    setAdding(true);
    try {
      const res = await apiClient.createCourseAlias({
        primaryCode: courseCode,
        aliasCode: trimmed,
      });
      if (res.success) {
        toast({ title: `${courseCode} linked with ${trimmed}.` });
        setNewCode("");
        fetchAliases();
      } else {
        setAddError(
          (res as { error?: string }).error ?? "Failed to create alias",
        );
      }
    } catch {
      setAddError("Failed to create alias");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string, aliasCode: string) => {
    setDeletingId(id);
    try {
      const res = await apiClient.deleteCourseAlias(id);
      if (res.success) {
        toast({ title: `Link with ${aliasCode} removed.` });
        fetchAliases();
      } else {
        toast({
          title: (res as any).error ?? "Failed",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Failed to remove alias", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const getLinkedCode = (
    alias: CourseAlias,
  ): { code: string; name: string; deptCode: string } => {
    if (alias.primaryCode === courseCode) {
      return {
        code: alias.aliasCourse?.code ?? alias.aliasCode,
        name: alias.aliasCourse?.name ?? "",
        deptCode: alias.aliasCourse?.departmentCode ?? "",
      };
    }
    return {
      code: alias.primaryCourse?.code ?? alias.primaryCode,
      name: alias.primaryCourse?.name ?? "",
      deptCode: alias.primaryCourse?.departmentCode ?? "",
    };
  };

  return (
    <div className="rounded-xl border border-gray-100 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <Link2 className="h-4 w-4 text-gray-400" />
        <span className="text-sm font-semibold text-gray-700">
          Cross-listed Courses
        </span>
        {aliases.length > 0 && (
          <Badge variant="secondary" className="ml-auto text-xs">
            {aliases.length}
          </Badge>
        )}
      </div>
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-9 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : aliases.length === 0 ? (
          <p className="text-sm text-gray-400 italic">
            No cross-listed courses. When two courses cover the same content for
            different departments, link them here so scheduling treats them as
            one.
          </p>
        ) : (
          <div className="space-y-2">
            {aliases.map((alias) => {
              const linked = getLinkedCode(alias);
              return (
                <div
                  key={alias.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-white px-3 py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded shrink-0">
                      {linked.code}
                    </span>
                    {linked.deptCode && (
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded shrink-0">
                        {linked.deptCode}
                      </span>
                    )}
                    {linked.name && (
                      <span className="text-xs text-gray-600 truncate">
                        {linked.name}
                      </span>
                    )}
                  </div>
                  {canEdit && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-red-500 hover:text-red-700 shrink-0"
                      disabled={deletingId === alias.id}
                      onClick={() => handleDelete(alias.id, linked.code)}
                    >
                      {deletingId === alias.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {canEdit && (
          <div className="pt-1 space-y-2">
            {addError && <ServerErrorBanner message={addError} />}
            <div className="flex gap-2">
              <Input
                placeholder="e.g. CSE409"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                maxLength={7}
                className="font-mono text-sm h-9"
                disabled={adding}
              />
              <Button
                size="sm"
                className="h-9 shrink-0"
                onClick={handleAdd}
                disabled={adding || !newCode.trim()}
              >
                {adding ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              Enter the course code to link. Both courses must exist in the
              system.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
