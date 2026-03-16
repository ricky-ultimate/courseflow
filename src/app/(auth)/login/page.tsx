"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/contexts/AuthContext";
import { usePageLoadReporter } from "@/contexts/PageLoadContext";
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
import { Loader2, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(1, "Password is required").min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  usePageLoadReporter(false);

  const { login } = useAuth();
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: "onBlur",
    defaultValues: { email: "", password: "" },
  });

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError("");
    setIsLoading(true);
    try {
      const result = await login({ email: data.email, password: data.password });
      if (result.success) {
        router.push("/dashboard");
      } else {
        setServerError(result.error || "Invalid credentials");
        form.setValue("password", "");
      }
    } catch {
      setServerError("An unexpected error occurred");
      form.setValue("password", "");
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Sign in to CourseFlow</h1>
        <p className="text-sm text-gray-500 mt-1">Enter your credentials to continue</p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className={`space-y-5 transition-opacity ${isLoading ? "opacity-60" : ""}`}>
          {serverError && (
            <ServerErrorBanner message={serverError} />
          )}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input
                    id="email"
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
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="text-base min-h-[44px] pr-12"
                      disabled={isLoading}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-0 top-0 h-full min-w-[44px] flex items-center justify-center text-gray-500 hover:text-gray-700 touch-manipulation"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
                <div className="flex justify-end">
                  <Link
                    href="/forgot-password"
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full h-11 text-base bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </Form>

      <p className="text-center text-sm text-gray-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-indigo-600 font-medium hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
