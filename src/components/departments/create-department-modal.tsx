"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import { HodCombobox } from "@/components/departments/hod-combobox";
import { Loader2 } from "lucide-react";
import { College } from "@/types";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const schema = z.object({
  name: z.string().min(1, "Department name is required").max(100),
  code: z
    .string()
    .min(1, "Department code is required")
    .regex(/^[A-Z]{2,4}$/, "Code must be 2-4 uppercase letters"),
  description: z.string().max(1000).optional(),
  college: z.nativeEnum(College),
  hodId: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface CreateDepartmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateDepartmentModal({
  open,
  onOpenChange,
  onSuccess,
}: CreateDepartmentModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState("");

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      code: "",
      description: "",
      college: College.CBAS,
      hodId: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: "",
        code: "",
        description: "",
        college: College.CBAS,
        hodId: "",
      });
      setServerError("");
    }
  }, [open, form]);

  const handleClose = useCallback(() => {
    if (!saving) onOpenChange(false);
  }, [saving, onOpenChange]);

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError("");
    setSaving(true);
    try {
      const res = await apiClient.createDepartment({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || undefined,
        college: data.college,
        hodId: data.hodId || undefined,
      });
      if (res.success) {
        toast({ title: "Department created successfully." });
        onOpenChange(false);
        onSuccess();
      } else {
        setServerError(
          (res as { error?: string }).error ?? "Failed to create department",
        );
      }
    } catch {
      setServerError("An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[560px]" onSwipeDown={handleClose}>
        <DialogHeader>
          <DialogTitle>Create Department</DialogTitle>
          <DialogDescription>
            Add a new academic department to the system.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className={`space-y-4 transition-opacity ${saving ? "opacity-60" : ""}`}
          >
            {serverError && <ServerErrorBanner message={serverError} />}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Department Name <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Computer Science"
                        maxLength={100}
                        disabled={saving}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Department Code <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., CS"
                        maxLength={4}
                        className="font-mono"
                        disabled={saving}
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value.toUpperCase().slice(0, 4),
                          )
                        }
                      />
                    </FormControl>
                    <FormDescription>2-4 uppercase letters</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter department description..."
                      rows={3}
                      maxLength={1000}
                      disabled={saving}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="college"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    College <span className="text-red-500">*</span>
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
                      <SelectItem value={College.CBAS}>
                        CBAS — Basic & Applied Sciences
                      </SelectItem>
                      <SelectItem value={College.CHMS}>
                        CHMS — Humanities & Management Sciences
                      </SelectItem>
                      <SelectItem value={College.CAHS}>
                        CAHS — Allied Health Sciences
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="hodId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Head of Department (Optional)</FormLabel>
                  <FormControl>
                    <HodCombobox
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Search by name..."
                      disabled={saving}
                    />
                  </FormControl>
                  <FormDescription>
                    Automatically links Head of Department to this department
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Create Department"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
