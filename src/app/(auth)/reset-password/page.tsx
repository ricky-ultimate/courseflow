"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { apiClient } from "@/lib/api";
import { CheckCircle, Eye, EyeOff, Loader2 } from "lucide-react";

const resetPasswordSchema = z
  .object({
    password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  usePageLoadReporter(false);

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onBlur",
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!token) {
      router.replace("/forgot-password");
    }
  }, [token, router]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!token) return;
    setServerError("");
    setIsLoading(true);
    try {
      const response = await apiClient.resetPassword(token, data.password);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setServerError(response.error || "Invalid or expired reset token");
      }
    } catch {
      setServerError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  });

  if (!token) return null;

  if (success) {
    return (
      <div className="space-y-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold">Password updated</h1>
          <p className="text-sm text-gray-500 mt-2">
            Redirecting to login in 3 seconds…
          </p>
        </div>
        <Button asChild>
          <Link href="/login">Go to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Set a new password</h1>
        <p className="text-sm text-gray-500 mt-1">Choose a secure password</p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className={`space-y-5 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
          {serverError && (
            <div className="space-y-2">
              <ServerErrorBanner message={serverError} />
              {serverError.includes("expired") && (
                <Link
                  href="/forgot-password"
                  className="block text-indigo-600 font-medium text-sm"
                >
                  Request a new link
                </Link>
              )}
            </div>
          )}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
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
                <FormLabel>Confirm new password</FormLabel>
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
          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update password"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-gray-500">
        <Link href="/forgot-password" className="text-indigo-600 hover:underline">
          Request a new link
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-64" />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
