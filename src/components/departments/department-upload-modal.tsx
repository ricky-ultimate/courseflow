"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileUp, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BulkOperationResult, Department } from "@/types";

const FILE_SIZE_LIMIT = 5 * 1024 * 1024;

interface DepartmentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type UploadResult = {
  type: "success" | "mixed";
  summary: { successCount: number; errorCount: number };
  errors?: Array<{ row: number; field: string; value: unknown; message: string }>;
} | null;

export function DepartmentUploadModal({ open, onOpenChange, onSuccess }: DepartmentUploadModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleFileSelect = (file: File | null) => {
    if (file && file.size > FILE_SIZE_LIMIT) { toast({ title: "File too large. Max 5MB.", variant: "destructive" }); return; }
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.getDepartmentsBulkTemplate();
      if (res.success && res.data) {
        const raw = res.data as unknown;
        const blob = raw instanceof Blob ? raw : new Blob([typeof raw === "string" ? raw : String(raw)], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "departments-template.csv";
        a.click();
        URL.revokeObjectURL(url);
        toast({ title: "Template downloaded" });
      }
    } catch {
      toast({ title: "Failed to download template", variant: "destructive" });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    if (selectedFile.size > FILE_SIZE_LIMIT) { toast({ title: "File too large. Max 5MB.", variant: "destructive" }); return; }
    try {
      setIsUploading(true);
      setUploadResult(null);
      const res = await apiClient.uploadDepartmentsBulk(selectedFile);
      const data = res.data as BulkOperationResult<Department> | undefined;
      const sum = data?.summary;
      if (res.success && data) {
        const count = sum?.successCount ?? data?.created?.length ?? 0;
        if (sum && sum.errorCount > 0) {
          setUploadResult({ type: "mixed", summary: { successCount: sum.successCount, errorCount: sum.errorCount }, errors: data.errors });
          onSuccess();
        } else {
          setUploadResult({ type: "success", summary: { successCount: count, errorCount: 0 } });
          onSuccess();
        }
      } else if (sum && (sum.successCount > 0 || sum.errorCount > 0)) {
        setUploadResult({ type: "mixed", summary: { successCount: sum.successCount, errorCount: sum.errorCount }, errors: data?.errors });
        onSuccess();
      } else {
        toast({ title: (res as { error?: string }).error || "Upload failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const close = () => { onOpenChange(false); setSelectedFile(null); setUploadResult(null); };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) { setSelectedFile(null); setUploadResult(null); } }}>
      <DialogContent className="md:max-w-[480px]" onSwipeDown={() => close()}>
        <DialogHeader>
          <DialogTitle>Upload Departments CSV</DialogTitle>
          <DialogDescription>Drop your CSV file here or click to browse. Accept .csv only. Max 5MB.</DialogDescription>
        </DialogHeader>
        {uploadResult ? (
          <div className="space-y-4 py-2">
            {uploadResult.type === "success" ? (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                <p className="font-medium">{uploadResult.summary.successCount} departments created successfully.</p>
              </div>
            ) : (
              <>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                  <p className="font-medium">{uploadResult.summary.successCount} created, {uploadResult.summary.errorCount} failed.</p>
                </div>
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="max-h-[240px] overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {["Row", "Field", "Value", "Error Message"].map((h) => <th key={h} className="p-2 text-left font-medium">{h}</th>)}
                          </tr>
                        </thead>
                        <tbody>
                          {uploadResult.errors.map((err, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{err.row}</td>
                              <td className="p-2">{err.field}</td>
                              <td className="p-2 truncate max-w-[80px]">{String(err.value ?? "—")}</td>
                              <td className="p-2 text-red-600">{err.message}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
            <DialogFooter>
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700" onClick={close}>Close</Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className={isUploading ? "opacity-60 pointer-events-none" : ""}>
              <div
                className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                onDragOver={(e) => !isUploading && e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (isUploading) return; const f = e.dataTransfer.files[0]; if (f?.name.toLowerCase().endsWith(".csv")) handleFileSelect(f); }}
                onClick={() => !isUploading && document.getElementById("dept-csv-input")?.click()}
              >
                <input id="dept-csv-input" type="file" accept=".csv" className="hidden" disabled={isUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-gray-500">({formatFileSize(selectedFile.size)})</span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleFileSelect(null); }}>
                      <X className="h-4 w-4" /><span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="h-10 w-10 text-gray-400" />
                    <p className="text-sm text-gray-500">Drop your CSV file here or click to browse</p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <button type="button" className="underline" onClick={handleDownloadTemplate}>Download template</button>
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={isUploading}>Cancel</Button>
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700" onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
