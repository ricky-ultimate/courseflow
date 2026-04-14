"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileUp, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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
    setIsUploading(true);
    try {
      const res = await apiClient.uploadCoursesBulk(selectedFile);
      if (res.success) {
        toast({ title: "Courses uploaded successfully." });
        onOpenChange(false);
        setSelectedFile(null);
        onSuccess();
      } else {
        toast({
          title: (res as any).error || "Upload failed",
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[440px]" onSwipeDown={handleClose}>
        <DialogHeader>
          <DialogTitle>Upload Courses CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to create multiple courses at once.{" "}
            <button
              type="button"
              className="text-indigo-600 underline"
              onClick={handleDownloadTemplate}
            >
              Download template
            </button>
          </DialogDescription>
        </DialogHeader>
        <div
          className={`transition-opacity ${isUploading ? "opacity-60 pointer-events-none" : ""}`}
        >
          <div
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-colors"
            onClick={() => document.getElementById("course-csv-input")?.click()}
          >
            <input
              id="course-csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setSelectedFile(f);
              }}
            />
            {selectedFile ? (
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm font-medium text-gray-800">
                  {selectedFile.name}
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
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isUploading}
          >
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
      </DialogContent>
    </Dialog>
  );
}
