"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileUp, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { BulkOperationResult, Course } from "@/types";

const FILE_SIZE_LIMIT = 5 * 1024 * 1024;

interface CourseUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type UploadResult = {
  type: "success" | "mixed" | "failed";
  summary: { totalRows: number; successCount: number; errorCount: number };
  errors?: Array<{
    row: number;
    field: string;
    value: unknown;
    message: string;
  }>;
  aliasWarnings?: string[];
} | null;

export function CourseUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: CourseUploadModalProps) {
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
    if (file && file.size > FILE_SIZE_LIMIT) {
      toast({ title: "File too large. Max 5MB.", variant: "destructive" });
      return;
    }
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.getCoursesBulkTemplate();
      if (res.success && res.data) {
        const raw = res.data as unknown;
        const blob =
          raw instanceof Blob
            ? raw
            : new Blob([String(raw)], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "courses-template.csv";
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
    if (selectedFile.size > FILE_SIZE_LIMIT) {
      toast({ title: "File too large. Max 5MB.", variant: "destructive" });
      return;
    }
    try {
      setIsUploading(true);
      setUploadResult(null);
      const res = await apiClient.uploadCoursesBulk(selectedFile);
      const data = res.data as BulkOperationResult<Course> | undefined;
      const sum = data?.summary;

      if (!data || !sum) {
        toast({
          title: (res as { error?: string }).error || "Upload failed",
          variant: "destructive",
        });
        return;
      }

      if (sum.totalRows === 0) {
        setUploadResult({ type: "failed", summary: sum, errors: [] });
      } else if (sum.successCount === 0 && sum.errorCount > 0) {
        setUploadResult({ type: "failed", summary: sum, errors: data.errors });
      } else if (sum.errorCount > 0) {
        setUploadResult({
          type: "mixed",
          summary: sum,
          errors: data.errors,
          aliasWarnings: data.aliasWarnings,
        });
        onSuccess();
      } else {
        setUploadResult({
          type: "success",
          summary: sum,
          aliasWarnings: data.aliasWarnings,
        });
        onSuccess();
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const close = () => {
    onOpenChange(false);
    setSelectedFile(null);
    setUploadResult(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setSelectedFile(null);
          setUploadResult(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-[480px]" onSwipeDown={() => close()}>
        <DialogHeader>
          <DialogTitle>Upload Courses CSV</DialogTitle>
          <DialogDescription>
            Drop your CSV file here or click to browse. Accept .csv only. Max
            5MB.
          </DialogDescription>
        </DialogHeader>

        {uploadResult ? (
          <div className="space-y-4 py-2">
            {uploadResult.type === "success" && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                <p className="font-medium">
                  {uploadResult.summary.successCount} course
                  {uploadResult.summary.successCount === 1 ? "" : "s"} created
                  successfully.
                </p>
              </div>
            )}

            {uploadResult.type === "mixed" && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800">
                <p className="font-medium">
                  {uploadResult.summary.successCount} created,{" "}
                  {uploadResult.summary.errorCount} failed.
                </p>
              </div>
            )}

            {uploadResult.type === "failed" && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                <p className="font-medium">
                  {uploadResult.summary.totalRows === 0
                    ? "The CSV file contains no data rows."
                    : `No courses were created. ${uploadResult.summary.errorCount} row${uploadResult.summary.errorCount === 1 ? "" : "s"} failed validation.`}
                </p>
              </div>
            )}

            {uploadResult.errors && uploadResult.errors.length > 0 && (
              <div className="rounded-lg border border-gray-200 overflow-hidden">
                <div className="max-h-[240px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        {["Row", "Field", "Value", "Error Message"].map((h) => (
                          <th key={h} className="p-2 text-left font-medium">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {uploadResult.errors.map((err, i) => (
                        <tr key={i} className="border-t">
                          <td className="p-2">{err.row}</td>
                          <td className="p-2">{err.field}</td>
                          <td className="p-2 truncate max-w-[80px]">
                            {String(err.value ?? "—")}
                          </td>
                          <td className="p-2 text-red-600">{err.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {uploadResult.aliasWarnings &&
              uploadResult.aliasWarnings.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-xs font-medium text-amber-800 mb-1.5">
                    Alias links skipped:
                  </p>
                  <ul className="space-y-1">
                    {uploadResult.aliasWarnings.map((w, i) => (
                      <li key={i} className="text-xs text-amber-800">
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            <DialogFooter>
              <Button
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700"
                onClick={close}
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div
              className={`transition-opacity ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
            >
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
                onDragOver={(e) => !isUploading && e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (isUploading) return;
                  const f = e.dataTransfer.files[0];
                  if (f?.name.toLowerCase().endsWith(".csv"))
                    handleFileSelect(f);
                }}
                onClick={() =>
                  document.getElementById("course-csv-input")?.click()
                }
              >
                <input
                  id="course-csv-input"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-gray-800">
                      {selectedFile.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({formatFileSize(selectedFile.size)})
                    </span>
                    <button
                      type="button"
                      className="text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="h-8 w-8 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      Drop a CSV file here or click to browse
                    </p>
                  </div>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <button
                  type="button"
                  className="underline"
                  onClick={handleDownloadTemplate}
                >
                  Download template
                </button>
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={close} disabled={isUploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Upload"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
