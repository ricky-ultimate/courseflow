"use client";

import { useState } from "react";
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
import { CheckCircle, Loader2 } from "lucide-react";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");
  usePageLoadReporter(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: "onBlur",
    defaultValues: { email: "" },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError("");
    setIsLoading(true);
    try {
      await apiClient.forgotPassword(data.email);
      setSubmitted(true);
    } catch (error) {
      setServerError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  });

  if (submitted) {
    return (
      <div className="space-y-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-gray-500 mt-2">
            If an account exists with that email address, you will receive a
            password reset link shortly.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/login">← Back to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className={`space-y-5 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
          {serverError && <ServerErrorBanner message={serverError} />}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
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
          <Button
            type="submit"
            className="w-full h-11"
            disabled={isLoading}
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send reset link"}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="text-indigo-600 hover:underline">
          ← Back to login
        </Link>
      </p>
    </div>
  );
}
