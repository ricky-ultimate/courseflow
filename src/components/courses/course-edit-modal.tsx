"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import { LecturerCombobox } from "@/components/courses/lecturer-combobox";
import { ErrorState } from "@/components/state/error-state";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Course, Department, Level, Semester } from "@/types";

const editCourseSchema = z.object({
  name: z.string().min(1, "Course name is required").max(200),
  level: z.string().min(1, "Level is required"),
  credits: z
    .string()
    .min(1, "Credits is required")
    .refine((v) => {
      const n = parseInt(v, 10);
      return !isNaN(n) && n >= 1 && n <= 6;
    }, "Credits must be 1–6"),
  semester: z.enum(["FIRST", "SECOND"]),
  departmentCode: z.string().min(1, "Department is required"),
  lecturerId: z.string().optional(),
  overview: z.string().max(2000).optional(),
  isGeneral: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

type EditCourseFormValues = z.infer<typeof editCourseSchema>;

const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

interface CourseEditModalProps {
  course: Course | null;
  onClose: () => void;
  onSuccess: (updated: Course) => void;
}

export function CourseEditModal({
  course,
  onClose,
  onSuccess,
}: CourseEditModalProps) {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const form = useForm<EditCourseFormValues>({
    resolver: zodResolver(editCourseSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      level: "",
      credits: "",
      semester: "FIRST",
      departmentCode: "",
      lecturerId: "",
      overview: "",
      isGeneral: false,
      isLocked: false,
    },
  });

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await apiClient.getDepartments({ limit: 100 });
      const d = getItemsFromResponse<Department>(res);
      if (d) setDepartments(d.items);
    } catch {
      setFetchError("Failed to load departments");
    }
  }, []);

  useEffect(() => {
    if (!course) return;
    setFetchError(null);
    setServerError("");
    setLoading(true);
    fetchDepartments().then(() => {
      form.reset({
        name: course.name,
        level: course.level,
        credits: String(course.credits),
        semester: course.semester,
        departmentCode: course.departmentCode,
        lecturerId: course.lecturerId ?? "",
        overview: course.overview ?? "",
        isGeneral: course.isGeneral,
        isLocked: course.isLocked,
      });
      setLoading(false);
    });
  }, [course, form, fetchDepartments]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!course) return;
    setServerError("");
    setSaving(true);
    try {
      const res = await apiClient.updateCourse(course.code, {
        name: data.name.trim(),
        level: data.level as Level,
        credits: parseInt(data.credits, 10),
        semester: data.semester as Semester,
        departmentCode: data.departmentCode,
        lecturerId: data.lecturerId || undefined,
        overview: data.overview?.trim() || undefined,
        isGeneral: data.isGeneral ?? false,
        isLocked: data.isLocked ?? false,
      });
      if (res.success && res.data) {
        toast({ title: `Course ${course.code} updated.` });
        onSuccess(res.data as Course);
      } else {
        setServerError(
          (res as { error?: string }).error ?? "Failed to update course",
        );
      }
    } catch {
      setServerError("Update failed");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Dialog open={!!course} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px]" onSwipeDown={onClose}>
        <DialogHeader>
          <DialogTitle>Edit Course — {course?.code}</DialogTitle>
          <DialogDescription>
            Update course details and assignments.
          </DialogDescription>
        </DialogHeader>

        {fetchError ? (
          <ErrorState
            entity="departments"
            onRetry={() => {
              setFetchError(null);
              fetchDepartments();
            }}
          />
        ) : loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-10 bg-gray-100 rounded-lg animate-pulse"
              />
            ))}
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className={`space-y-4 transition-opacity ${saving ? "opacity-60" : ""}`}
            >
              {serverError && <ServerErrorBanner message={serverError} />}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <FormLabel>Course Code</FormLabel>
                  <Input
                    value={course?.code ?? ""}
                    disabled
                    className="font-mono bg-gray-50 text-gray-500"
                  />
                </div>
                <FormField
                  control={form.control}
                  name="credits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Credits <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={6}
                          disabled={saving}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Course Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input maxLength={200} disabled={saving} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Level <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={saving}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {LEVEL_OPTIONS.map((l) => (
                            <SelectItem key={l.value} value={l.value}>
                              {l.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Semester <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        disabled={saving}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Semester.FIRST}>First</SelectItem>
                          <SelectItem value={Semester.SECOND}>
                            Second
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="departmentCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Department <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        form.setValue("lecturerId", "");
                      }}
                      disabled={saving}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.code} value={d.code}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="lecturerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lecturer</FormLabel>
                    <FormControl>
                      <LecturerCombobox
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        departmentCode={
                          form.watch("departmentCode") || undefined
                        }
                        placeholder="Search by name or email..."
                        disabled={saving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="overview"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overview</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        maxLength={2000}
                        disabled={saving}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdmin && (
                <div className="flex items-center gap-6">
                  <FormField
                    control={form.control}
                    name="isGeneral"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={saving}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal text-sm">
                          General Course
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isLocked"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={saving}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal text-sm">
                          Locked
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
