"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CourseUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CourseUploadModal({ open, onOpenChange, onSuccess }: CourseUploadModalProps) {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.getCoursesBulkTemplate();
      if (res.success && res.data) {
        const raw = res.data as unknown;
        const blob = raw instanceof Blob ? raw : new Blob([String(raw)], { type: "text/csv" });
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
    try {
      setIsUploading(true);
      const res = await apiClient.uploadCoursesBulk(selectedFile);
      if (res.success) {
        toast({ title: "Courses uploaded successfully." });
        onOpenChange(false);
        setSelectedFile(null);
        onSuccess();
      } else {
        toast({ title: (res as any).error || "Upload failed", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setSelectedFile(null); onOpenChange(o); }}>
      <DialogContent className="md:max-w-md" onSwipeDown={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>Upload Courses CSV</DialogTitle>
        </DialogHeader>
        <div className={isUploading ? "opacity-60 pointer-events-none" : ""}>
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
            onClick={() => !isUploading && document.getElementById("course-csv")?.click()}
          >
            <input id="course-csv" type="file" accept=".csv" className="hidden" disabled={isUploading}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); }} />
            {selectedFile ? (
              <p className="text-sm font-medium">{selectedFile.name}</p>
            ) : (
              <p className="text-sm text-gray-500">Drop CSV or click to browse</p>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            <button type="button" className="underline" onClick={handleDownloadTemplate}>Download template</button>
          </p>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>Cancel</Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
