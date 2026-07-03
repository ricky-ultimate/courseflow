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
import {
  Loader2,
  FileUp,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Course, MultiFileBulkOperationResult } from "@/types";

const FILE_SIZE_LIMIT = 5 * 1024 * 1024;
const MAX_FILES = 20;

type FileStatus = "pending" | "uploading";

interface SelectedFileEntry {
  file: File;
  status: FileStatus;
}

interface CourseUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CourseUploadModal({
  open,
  onOpenChange,
  onSuccess,
}: CourseUploadModalProps) {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileEntry[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadReport, setUploadReport] =
    useState<MultiFileBulkOperationResult<Course> | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const addFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    const csvFiles = incoming.filter((f) =>
      f.name.toLowerCase().endsWith(".csv"),
    );
    const rejectedType = incoming.length - csvFiles.length;

    const existingNames = new Set(selectedFiles.map((e) => e.file.name));
    const oversized = csvFiles.filter((f) => f.size > FILE_SIZE_LIMIT);
    const duplicates = csvFiles.filter(
      (f) => f.size <= FILE_SIZE_LIMIT && existingNames.has(f.name),
    );
    const additions = csvFiles.filter(
      (f) => f.size <= FILE_SIZE_LIMIT && !existingNames.has(f.name),
    );

    const combined = [
      ...selectedFiles,
      ...additions.map((f) => ({ file: f, status: "pending" as FileStatus })),
    ];
    const truncated = combined.length > MAX_FILES;
    const finalList = truncated ? combined.slice(0, MAX_FILES) : combined;

    setSelectedFiles(finalList);
    setUploadReport(null);

    if (rejectedType > 0) {
      toast({
        title: `${rejectedType} file(s) skipped: only CSV files are accepted.`,
        variant: "destructive",
      });
    }
    if (oversized.length > 0) {
      toast({
        title: `${oversized.length} file(s) exceed the 5MB limit and were skipped.`,
        variant: "destructive",
      });
    }
    if (duplicates.length > 0) {
      toast({
        title: `${duplicates.length} file(s) were already added.`,
        variant: "destructive",
      });
    }
    if (truncated) {
      toast({
        title: `A maximum of ${MAX_FILES} files can be uploaded at once.`,
        variant: "destructive",
      });
    }
  };

  const removeFile = (name: string) => {
    setSelectedFiles((prev) => prev.filter((e) => e.file.name !== name));
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
    if (selectedFiles.length === 0) return;

    setIsUploading(true);
    setUploadReport(null);
    setSelectedFiles((prev) =>
      prev.map((entry) => ({ ...entry, status: "uploading" as FileStatus })),
    );

    try {
      const res = await apiClient.uploadCoursesBulkMulti(
        selectedFiles.map((entry) => entry.file),
      );

      const report = res.data as
        | MultiFileBulkOperationResult<Course>
        | undefined;

      if (!res.success || !report) {
        toast({
          title: (res as { error?: string }).error || "Upload failed",
          variant: "destructive",
        });
        setSelectedFiles((prev) =>
          prev.map((entry) => ({ ...entry, status: "pending" as FileStatus })),
        );
        return;
      }

      setUploadReport(report);
      if (report.summary.successCount > 0) {
        onSuccess();
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      setSelectedFiles((prev) =>
        prev.map((entry) => ({ ...entry, status: "pending" as FileStatus })),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const close = () => {
    onOpenChange(false);
    setSelectedFiles([]);
    setUploadReport(null);
  };

  const reset = () => {
    setSelectedFiles([]);
    setUploadReport(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) {
          setSelectedFiles([]);
          setUploadReport(null);
        }
      }}
    >
      <DialogContent className="sm:max-w-[560px]" onSwipeDown={() => close()}>
        <DialogHeader>
          <DialogTitle>Upload Courses CSV</DialogTitle>
          <DialogDescription>
            Select one or more CSV files. Each file can contain courses for a
            different department or college. CSV only, max 5MB per file, up to{" "}
            {MAX_FILES} files.
          </DialogDescription>
        </DialogHeader>

        {uploadReport ? (
          <div className="space-y-4 py-2">
            <div
              className={`rounded-lg border p-4 ${
                uploadReport.summary.errorCount === 0
                  ? "border-green-200 bg-green-50 text-green-800"
                  : uploadReport.summary.successCount === 0
                    ? "border-red-200 bg-red-50 text-red-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <p className="font-medium">
                {uploadReport.summary.successCount} course
                {uploadReport.summary.successCount === 1 ? "" : "s"} created
                across {uploadReport.summary.totalFiles} file
                {uploadReport.summary.totalFiles === 1 ? "" : "s"}.
                {uploadReport.summary.errorCount > 0
                  ? ` ${uploadReport.summary.errorCount} row${uploadReport.summary.errorCount === 1 ? "" : "s"} failed.`
                  : ""}
              </p>
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto">
              {uploadReport.files.map((fileResult) => (
                <div
                  key={fileResult.fileName}
                  className="rounded-lg border border-gray-200 overflow-hidden"
                >
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-50">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {fileResult.fileName}
                      </span>
                    </div>
                    {fileResult.result.summary.errorCount === 0 ? (
                      <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    )}
                  </div>
                  <div className="px-3 py-2 text-xs text-gray-600">
                    {fileResult.result.summary.successCount} created,{" "}
                    {fileResult.result.summary.errorCount} failed of{" "}
                    {fileResult.result.summary.totalRows} rows
                  </div>
                  {fileResult.result.errors.length > 0 && (
                    <div className="max-h-[160px] overflow-y-auto border-t">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            {["Row", "Field", "Value", "Error"].map((h) => (
                              <th key={h} className="p-2 text-left font-medium">
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {fileResult.result.errors.map((err, i) => (
                            <tr key={i} className="border-t">
                              <td className="p-2">{err.row}</td>
                              <td className="p-2">{err.field}</td>
                              <td className="p-2 truncate max-w-[80px]">
                                {String(err.value ?? "—")}
                              </td>
                              <td className="p-2 text-red-600">
                                {err.message}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {fileResult.result.aliasWarnings &&
                    fileResult.result.aliasWarnings.length > 0 && (
                      <div className="border-t px-3 py-2 bg-amber-50">
                        <p className="text-xs font-medium text-amber-800 mb-1">
                          Alias links skipped:
                        </p>
                        <ul className="space-y-0.5">
                          {fileResult.result.aliasWarnings.map((w, i) => (
                            <li key={i} className="text-xs text-amber-800">
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={reset}>
                Upload More
              </Button>
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
                  if (e.dataTransfer.files.length)
                    addFiles(e.dataTransfer.files);
                }}
                onClick={() =>
                  document.getElementById("course-csv-input")?.click()
                }
              >
                <input
                  id="course-csv-input"
                  type="file"
                  accept=".csv"
                  multiple
                  className="hidden"
                  disabled={isUploading}
                  onChange={(e) => {
                    if (e.target.files?.length) addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
                <div className="flex flex-col items-center gap-2">
                  <FileUp className="h-8 w-8 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Drop CSV files here or click to browse
                  </p>
                  <p className="text-xs text-gray-400">
                    Multiple files supported
                  </p>
                </div>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto">
                  {selectedFiles.map((entry) => (
                    <div
                      key={entry.file.name}
                      className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm font-medium truncate">
                          {entry.file.name}
                        </span>
                        <span className="text-xs text-gray-400 shrink-0">
                          ({formatFileSize(entry.file.size)})
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {entry.status === "uploading" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                        ) : (
                          <button
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => removeFile(entry.file.name)}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

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
                disabled={selectedFiles.length === 0 || isUploading}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : selectedFiles.length > 0 ? (
                  `Upload ${selectedFiles.length} File${selectedFiles.length === 1 ? "" : "s"}`
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
