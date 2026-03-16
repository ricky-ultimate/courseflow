"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Role } from "@/types";
import { apiClient } from "@/lib/api";
import { getItemsFromResponse } from "@/lib/utils";
import type { Department } from "@/types";

const registerSchema = z
  .object({
    name: z.string(),
    matricNO: z.string().min(1, "Matric / Staff number is required"),
    email: z.string().min(1, "Email is required").email("Invalid email format"),
    password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    role: z.nativeEnum(Role),
    departmentCode: z.string(),
    verificationCode: z.string(),
    phone: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })
  .superRefine((data, ctx) => {
    if (data.role !== Role.ADMIN && !data.departmentCode?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Please select your department", path: ["departmentCode"] });
    }
    if ([Role.LECTURER, Role.HOD, Role.ADMIN].includes(data.role) && !data.verificationCode?.trim()) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Verification code is required", path: ["verificationCode"] });
    }
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [deptLoading, setDeptLoading] = useState(true);
  const [deptError, setDeptError] = useState<string | null>(null);
  const [serverError, setServerError] = useState("");
  usePageLoadReporter(deptLoading);

  const { register } = useAuth();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      matricNO: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: Role.STUDENT,
      departmentCode: "",
      verificationCode: "",
      phone: "",
    },
  });

  const role = form.watch("role");
  const needsDepartment = role !== Role.ADMIN;
  const needsVerificationCode = [Role.LECTURER, Role.HOD, Role.ADMIN].includes(role);
  const needsPhone = role === Role.LECTURER || role === Role.HOD;

  const fetchDepartments = async () => {
    setDeptError(null);
    setDeptLoading(true);
    try {
      const response = await apiClient.getDepartments({ limit: 100 });
      const result = getItemsFromResponse<Department>(response);
      if (result) setDepartments(result.items);
    } catch {
      setDeptError("Failed to load departments. Retry.");
    } finally {
      setDeptLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (role === Role.ADMIN) {
      form.setValue("departmentCode", "");
    }
    form.setValue("verificationCode", "");
    form.setValue("phone", "");
  }, [role, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError("");
    setIsLoading(true);
    try {
      const payload = {
        matricNO: data.matricNO.trim(),
        email: data.email.trim(),
        password: data.password,
        name: data.name.trim() || undefined,
        role: data.role,
        verificationCode: needsVerificationCode ? data.verificationCode.trim() : undefined,
        departmentCode: needsDepartment ? data.departmentCode : undefined,
        phone: data.phone.trim() || undefined,
      };
      const result = await register(payload);
      if (result.success) {
        router.push("/dashboard");
      } else {
        setServerError(result.error || "Registration failed");
      }
    } catch {
      setServerError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in your details to get started</p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className={`space-y-5 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
          {serverError && <ServerErrorBanner message={serverError} />}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    className="text-base min-h-[44px]"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="matricNO"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Matric / Staff number *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="CS/2023/001"
                    className="text-base min-h-[44px]"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="you@university.edu"
                    className="text-base min-h-[44px]"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="text-base min-h-[44px] pr-12"
                      disabled={isLoading}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full min-w-[44px] flex items-center justify-center text-gray-500"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm password *</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="text-base min-h-[44px]"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger className="text-base min-h-[44px]">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={Role.STUDENT}>Student</SelectItem>
                    <SelectItem value={Role.LECTURER}>Lecturer</SelectItem>
                    <SelectItem value={Role.HOD}>HOD</SelectItem>
                    <SelectItem value={Role.ADMIN}>Admin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: needsDepartment ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <FormField
                control={form.control}
                name="departmentCode"
                render={({ field }) => (
                  <FormItem className="pt-0">
                    <FormLabel>Department *</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        if (v === "__retry__") {
                          fetchDepartments();
                          return;
                        }
                        field.onChange(v);
                      }}
                      disabled={deptLoading || isLoading}
                    >
                      <FormControl>
                        <SelectTrigger className="text-base min-h-[44px]">
                          {deptLoading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                              Loading departments…
                            </span>
                          ) : (
                            <SelectValue placeholder={deptError ? "Failed to load departments. Retry." : "Select department..."} />
                          )}
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {deptLoading ? (
                          <SelectItem value="" disabled>
                            <span className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                              Loading departments…
                            </span>
                          </SelectItem>
                        ) : deptError ? (
                          <SelectItem value="__retry__" className="text-indigo-600 font-medium cursor-pointer">
                            Failed to load departments. Retry.
                          </SelectItem>
                        ) : (
                          departments.map((d) => (
                            <SelectItem key={d.code} value={d.code}>
                              {d.name} ({d.code})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: needsVerificationCode ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <FormField
                control={form.control}
                name="verificationCode"
                render={({ field }) => (
                  <FormItem className="pt-0">
                    <FormLabel>Verification code *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="XXXX-XXXX"
                        className="text-base min-h-[44px]"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div
            className="grid transition-[grid-template-rows] duration-300 ease-in-out"
            style={{ gridTemplateRows: needsPhone ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="pt-0">
                    <FormLabel>Phone number</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="+234 800 000 0000"
                        className="text-base min-h-[44px]"
                        disabled={isLoading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-gray-500">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
