"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import { Loader2 } from "lucide-react";

const complaintSchema = z.object({
  name: z.string().min(1, "Full name is required"),
  department: z.string().min(1, "Department is required"),
  subject: z.string().min(5, "Subject must be at least 5 characters").max(200),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000),
});

type ComplaintFormValues = z.infer<typeof complaintSchema>;

interface ComplaintSubmitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function ComplaintSubmitDialog({
  open,
  onOpenChange,
  onSuccess,
}: ComplaintSubmitDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const form = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    mode: "onBlur",
    defaultValues: {
      name: user?.name ?? "",
      department: "",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    if (open && user) {
      form.reset({
        name: user.name ?? "",
        department: "",
        subject: "",
        message: "",
      });
      setSubmitError("");
    }
  }, [open, user, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setSubmitError("");
    if (!user?.email) return;
    setSubmitting(true);
    try {
      const res = await apiClient.createComplaint({
        name: data.name,
        email: user.email,
        department: data.department,
        subject: data.subject,
        message: data.message,
      });
      if (res.success) {
        toast({ title: "Your complaint has been submitted." });
        onOpenChange(false);
        form.reset();
        onSuccess();
      } else {
        setSubmitError(
          (res as { error?: string }).error || "Submission failed",
        );
      }
    } catch {
      setSubmitError("Submission failed");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px]"
        onSwipeDown={() => onOpenChange(false)}
      >
        <DialogHeader>
          <DialogTitle>Submit Complaint</DialogTitle>
          <DialogDescription>
            Describe your issue and we will get back to you.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className={`space-y-4 transition-opacity ${submitting ? "opacity-60" : ""}`}
          >
            {submitError && <ServerErrorBanner message={submitError} />}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Full name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input disabled={submitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="bg-gray-50 text-gray-500"
                  disabled
                />
              </div>
            </div>
            <FormField
              control={form.control}
              name="department"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Department <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. Computer Science"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Subject <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Brief description"
                      maxLength={200}
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Message <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      maxLength={1000}
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <div className="flex justify-between items-center">
                    <FormMessage />
                    <span className="text-xs text-gray-400 ml-auto">
                      {field.value.length}/1000
                    </span>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
