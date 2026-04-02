"use client";

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
import { Department, College } from "@/types";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

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

interface DepartmentEditModalProps {
  dept: Department | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function DepartmentEditModal({
  dept,
  onClose,
  onSuccess,
}: DepartmentEditModalProps) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
    if (dept) {
      setError("");
      form.reset({
        name: dept.name,
        code: dept.code,
        description: dept.description ?? "",
        college: dept.college,
        hodId: dept.hodId ?? "",
      });
    }
  }, [dept, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!dept) return;
    setError("");
    try {
      setSaving(true);
      const res = await apiClient.updateDepartment(dept.code, {
        name: data.name,
        code: data.code,
        description: data.description || undefined,
        college: data.college,
        hodId: data.hodId || undefined,
      });
      if (res.success) {
        toast({ title: "Department updated." });
        onClose();
        onSuccess();
      } else setError((res as { error?: string }).error ?? "Failed to update");
    } catch {
      setError("Update failed");
    } finally {
      setSaving(false);
    }
  });

  return (
    <Dialog open={!!dept} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="md:max-w-[520px]" onSwipeDown={() => onClose()}>
        <DialogHeader>
          <DialogTitle>Edit Department</DialogTitle>
          <DialogDescription>Update department details.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={handleSubmit}
            className={`space-y-4 transition-opacity ${saving ? "opacity-60" : ""}`}
          >
            {error && <ServerErrorBanner message={error} />}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Department name</FormLabel>
                  <FormControl>
                    <Input maxLength={100} disabled={saving} {...field} />
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
                  <FormLabel>Department code</FormLabel>
                  <FormControl>
                    <Input
                      className="font-mono"
                      disabled={saving}
                      {...field}
                      onChange={(e) =>
                        field.onChange(e.target.value.toUpperCase().slice(0, 4))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
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
                  <FormLabel>College</FormLabel>
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
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose()}
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
      </DialogContent>
    </Dialog>
  );
}
