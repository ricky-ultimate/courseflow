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
import { CourseAliasPanel } from "@/components/courses/course-alias-panel";
import { Loader2, CheckCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Course, Department, Level, Semester } from "@/types";

const schema = z.object({
  code: z
    .string()
    .min(1, "Course code is required")
    .regex(/^[A-Za-z]{2,4}\d{3}$/, "2–4 letters + 3 digits (e.g. CS101)"),
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

type FormValues = z.infer<typeof schema>;

const LEVEL_OPTIONS = [
  { value: Level.LEVEL_100, label: "100 Level" },
  { value: Level.LEVEL_200, label: "200 Level" },
  { value: Level.LEVEL_300, label: "300 Level" },
  { value: Level.LEVEL_400, label: "400 Level" },
  { value: Level.LEVEL_500, label: "500 Level" },
];

interface CreateCourseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (course: Course) => void;
  defaultDepartmentCode?: string;
}

export function CreateCourseModal({
  open,
  onOpenChange,
  onSuccess,
  defaultDepartmentCode,
}: CreateCourseModalProps) {
  const { isAdmin, isHod, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [serverError, setServerError] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [createdCourse, setCreatedCourse] = useState<Course | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      code: "",
      name: "",
      level: "",
      credits: "",
      semester: "FIRST",
      departmentCode:
        defaultDepartmentCode ?? (isHod ? (user?.departmentCode ?? "") : ""),
      lecturerId: "",
      overview: "",
      isGeneral: false,
      isLocked: false,
    },
  });

  const fetchDepts = useCallback(async () => {
    setLoadingDepts(true);
    try {
      const res = await apiClient.getDepartments({ limit: 100 });
      const r = getItemsFromResponse<Department>(res);
      if (r) setDepartments(r.items);
    } catch {
    } finally {
      setLoadingDepts(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchDepts();
      setServerError("");
      setCreatedCourse(null);
      form.reset({
        code: "",
        name: "",
        level: "",
        credits: "",
        semester: "FIRST",
        departmentCode:
          defaultDepartmentCode ?? (isHod ? (user?.departmentCode ?? "") : ""),
        lecturerId: "",
        overview: "",
        isGeneral: false,
        isLocked: false,
      });
    }
  }, [
    open,
    defaultDepartmentCode,
    isHod,
    user?.departmentCode,
    form,
    fetchDepts,
  ]);

  const handleClose = () => {
    onOpenChange(false);
    setCreatedCourse(null);
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError("");
    setLoading(true);
    try {
      const res = await apiClient.createCourse({
        code: data.code.trim().toUpperCase(),
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
        const course = res.data as Course;
        toast({ title: `Course ${course.code} created.` });
        setCreatedCourse(course);
        onSuccess(course);
      } else {
        setServerError(
          (res as { error?: string }).error ?? "Failed to create course",
        );
      }
    } catch {
      setServerError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]" onSwipeDown={handleClose}>
        <DialogHeader>
          <DialogTitle>
            {createdCourse ? "Course Created" : "New Course"}
          </DialogTitle>
          {!createdCourse && (
            <DialogDescription>
              Add a new course to the system.
            </DialogDescription>
          )}
        </DialogHeader>

        {createdCourse ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800">
                  {createdCourse.code} — {createdCourse.name}
                </p>
                <p className="text-xs text-green-700 mt-0.5">
                  Created successfully. Link cross-listed courses below if
                  needed.
                </p>
              </div>
            </div>
            {(isAdmin || isHod) && (
              <CourseAliasPanel courseCode={createdCourse.code} canEdit />
            )}
            <DialogFooter>
              <Button onClick={handleClose} className="w-full sm:w-auto">
                Done
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={handleSubmit}
              className={`space-y-4 transition-opacity ${loading ? "opacity-60" : ""}`}
            >
              {serverError && <ServerErrorBanner message={serverError} />}

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Code <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. CS101"
                          maxLength={7}
                          disabled={loading}
                          className="font-mono"
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
                          placeholder="3"
                          min={1}
                          max={6}
                          disabled={loading}
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
                      <Input
                        placeholder="e.g. Introduction to Computer Science"
                        maxLength={200}
                        disabled={loading}
                        {...field}
                      />
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
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
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
                        disabled={loading}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="FIRST">First</SelectItem>
                          <SelectItem value="SECOND">Second</SelectItem>
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
                      disabled={loading || loadingDepts || (isHod && !isAdmin)}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              loadingDepts ? "Loading..." : "Select department"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {departments.map((d) => (
                          <SelectItem key={d.code} value={d.code}>
                            {d.name} ({d.code})
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
                        disabled={loading}
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
                        placeholder="Optional course description..."
                        rows={2}
                        maxLength={2000}
                        disabled={loading}
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
                            disabled={loading}
                            className="rounded border-gray-300"
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal text-sm">
                          General Course (GST)
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
                            disabled={loading}
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
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Create Course"
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
