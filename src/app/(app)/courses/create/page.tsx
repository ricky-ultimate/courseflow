"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  FormDescription,
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
import { Department, Level, Semester } from "@/types";

const createCourseSchema = z.object({
  code: z.string().min(1, "Course code is required").regex(/^[A-Za-z]{2,4}\d{3}$/, "2–4 letters + 3 digits (e.g., CS101, MTH201)"),
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

type CreateCourseFormValues = z.infer<typeof createCourseSchema>;

export default function CreateCoursePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const departmentFromUrl = searchParams.get("department") ?? "";
  const { isAuthenticated, isAdmin, isHod } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [serverError, setServerError] = useState("");
  usePageLoadReporter(loadingData);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);

  const canCreate = isAdmin || isHod;

  const form = useForm<CreateCourseFormValues>({
    resolver: zodResolver(createCourseSchema),
    mode: "onBlur",
    defaultValues: {
      code: "",
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

  const levelOptions = [
    { value: Level.LEVEL_100, label: "100 Level" },
    { value: Level.LEVEL_200, label: "200 Level" },
    { value: Level.LEVEL_300, label: "300 Level" },
    { value: Level.LEVEL_400, label: "400 Level" },
    { value: Level.LEVEL_500, label: "500 Level" },
  ];

  const fetchData = useCallback(async () => {
    setFetchError(null);
    setLoadingData(true);
    try {
      const deptResponse = await apiClient.getDepartments({ limit: 100 });
      const deptResult = getItemsFromResponse<Department>(deptResponse);
      if (deptResult) setDepartments(deptResult.items);
    } catch {
      setFetchError("Failed to load departments");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !canCreate) {
      router.replace(!isAuthenticated ? "/login" : "/dashboard");
      return;
    }
    fetchData();
  }, [isAuthenticated, canCreate, router, fetchData]);

  useEffect(() => {
    if (departmentFromUrl && departments.some((d) => d.code === departmentFromUrl)) {
      form.setValue("departmentCode", departmentFromUrl);
    }
  }, [departmentFromUrl, departments, form]);

  if (!isAuthenticated || !canCreate) {
    return null;
  }

  if (fetchError && !loadingData) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <ErrorState entity="departments" onRetry={fetchData} />
      </div>
    );
  }

  if (loadingData) {
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

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError("");
    setLoading(true);
    try {
      const codeUpper = data.code.trim().toUpperCase();
      const response = await apiClient.createCourse({
        code: codeUpper,
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

      if (response.success) {
        toast({ title: `Course ${codeUpper} created.` });
        router.push("/courses");
      } else {
        setServerError(response.error || "Failed to create course");
      }
    } catch (error) {
      console.error("Create course failed:", error);
      setServerError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <BookOpen className="h-8 w-8" />
            Create Course
          </h1>
          <p className="text-muted-foreground">
            Add a new course to the system with complete details
          </p>
        </div>

        <Card className="max-w-[560px]">
          <CardHeader>
            <CardTitle>Course Information</CardTitle>
            <CardDescription>
              Enter all details for the new course including lecturer assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
                {serverError && <ServerErrorBanner message={serverError} />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course Code <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., CS101"
                            maxLength={7}
                            style={{ textTransform: "uppercase" }}
                            disabled={loading}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormDescription>2–4 letters + 3 digits (e.g., CS101, MTH201)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="credits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credits <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 3"
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
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Course Name <span className="text-red-500">*</span></FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Introduction to Computer Science"
                            maxLength={200}
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="level"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Level <span className="text-red-500">*</span></FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {levelOptions.map((level) => (
                              <SelectItem key={level.value} value={level.value}>
                                {level.label}
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
                        <FormLabel>Semester <span className="text-red-500">*</span></FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select semester" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FIRST">First Semester</SelectItem>
                            <SelectItem value="SECOND">Second Semester</SelectItem>
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
                        <FormLabel>Department <span className="text-red-500">*</span></FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            form.setValue("lecturerId", "");
                          }}
                          disabled={loading}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select department" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {departments.map((dept) => (
                              <SelectItem key={dept.code} value={dept.code}>
                                {dept.name} ({dept.code})
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
                      <FormItem className="md:col-span-2">
                        <FormLabel>Lecturer</FormLabel>
                        <FormControl>
                          <LecturerCombobox
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            departmentCode={form.watch("departmentCode") || undefined}
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
                      <FormItem className="md:col-span-2">
                        <FormLabel>Course Overview (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter course description/overview..."
                            rows={4}
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
                    <FormField
                      control={form.control}
                      name="isGeneral"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 flex flex-row items-center gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="rounded border-gray-300"
                              disabled={loading}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">
                            General Course (GST) - University-wide course
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  {isAdmin && (
                    <FormField
                      control={form.control}
                      name="isLocked"
                      render={({ field }) => (
                        <FormItem className="md:col-span-2 flex flex-row items-center gap-2">
                          <FormControl>
                            <input
                              type="checkbox"
                              checked={field.value}
                              onChange={(e) => field.onChange(e.target.checked)}
                              className="rounded border-gray-300"
                              disabled={loading}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer font-normal">
                            Lock Course (Prevent deletion)
                          </FormLabel>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Course"}
                </Button>
              </div>
            </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
