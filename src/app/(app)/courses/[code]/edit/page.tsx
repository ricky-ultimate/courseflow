"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { ErrorState } from "@/components/state/error-state";
import { LecturerCombobox } from "@/components/courses/lecturer-combobox";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import { Course, Department, Level, Semester } from "@/types";

const editCourseSchema = z.object({
  name: z.string().min(1, "Course name is required").max(200),
  level: z.string().min(1, "Level is required"),
  credits: z.string().min(1, "Credits is required").refine((v) => {
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

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const { isAdmin, isHod, user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [serverError, setServerError] = useState("");
  usePageLoadReporter(loading);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [course, setCourse] = useState<Course | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const isStaff = isAdmin || isHod;

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

  const fetchData = useCallback(async () => {
    if (!code || !isStaff) return;
    setFetchError(null);
    setLoading(true);
    try {
      const [courseRes, deptRes] = await Promise.all([
        apiClient.getCourseByCode(code),
        apiClient.getDepartments({ limit: 100 }),
      ]);
      if (courseRes.success && courseRes.data) {
        const c = courseRes.data as Course;
        setCourse(c);
        form.reset({
          name: c.name,
          level: c.level,
          credits: String(c.credits),
          semester: c.semester,
          departmentCode: c.departmentCode,
          lecturerId: c.lecturerId ?? "",
          overview: c.overview ?? "",
          isGeneral: c.isGeneral,
          isLocked: c.isLocked,
        });
        const d = getItemsFromResponse<Department>(deptRes);
        if (d) setDepartments(d.items);
      } else {
        setFetchError("Course not found");
      }
    } catch {
      setFetchError("Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [code, isStaff, form]);

  useEffect(() => {
    if (code && isStaff) fetchData();
  }, [code, isStaff, fetchData]);

  if (!isStaff) {
    router.push("/courses");
    return null;
  }

  if (fetchError) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <ErrorState entity="course" onRetry={fetchData} />
      </div>
    );
  }

  if (loading || !course) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (isHod && user?.departmentCode !== course.departmentCode) {
    toast({ title: "You can only edit courses in your department", variant: "destructive" });
    router.push("/courses");
    return null;
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError("");
    setSaving(true);
    try {
      const res = await apiClient.updateCourse(code, {
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
      if (res.success) {
        toast({ title: `Course ${code} updated.` });
        router.push("/courses");
      } else {
        setServerError((res as { error?: string }).error || "Failed to update course");
      }
    } catch {
      setServerError("Update failed");
    } finally {
      setSaving(false);
    }
  });

  const levelOptions = [
    { value: Level.LEVEL_100, label: "100 Level" },
    { value: Level.LEVEL_200, label: "200 Level" },
    { value: Level.LEVEL_300, label: "300 Level" },
    { value: Level.LEVEL_400, label: "400 Level" },
    { value: Level.LEVEL_500, label: "500 Level" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Edit Course — {code}
        </h1>
      </div>

      <Card className="max-w-[560px]">
        <CardHeader>
          <CardTitle>Course Information</CardTitle>
          <CardDescription>Update course details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity ${saving ? "opacity-60" : ""}`}>
              {serverError && <ServerErrorBanner message={serverError} />}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <FormLabel>Course Code</FormLabel>
                  <Input value={code} disabled className="font-mono bg-gray-50" />
                </div>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Course Name *</FormLabel>
                      <FormControl>
                        <Input maxLength={200} disabled={saving} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Level *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {levelOptions.map((l) => (
                            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="credits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Credits *</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} max={6} disabled={saving} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="semester"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semester *</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Semester.FIRST}>First Semester</SelectItem>
                          <SelectItem value={Semester.SECOND}>Second Semester</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departmentCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={(v) => {
                          field.onChange(v);
                          form.setValue("lecturerId", "");
                        }}
                        disabled={saving}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d.code} value={d.code}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="lecturerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lecturer</FormLabel>
                    <FormControl>
                      <LecturerCombobox
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        departmentCode={form.watch("departmentCode") || undefined}
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
                      <Textarea rows={4} maxLength={2000} disabled={saving} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isAdmin && (
                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="isGeneral"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={saving}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">General Course</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isLocked"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center gap-2">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={(e) => field.onChange(e.target.checked)}
                            disabled={saving}
                          />
                        </FormControl>
                        <FormLabel className="cursor-pointer font-normal">Locked</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
