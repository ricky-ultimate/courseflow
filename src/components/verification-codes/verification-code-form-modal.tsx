"use client";

import { UseFormReturn } from "react-hook-form";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import { Loader2 } from "lucide-react";
import { Role } from "@/types";

interface VerificationCodeFormValues {
  code: string;
  role: Role;
  description?: string;
  maxUsage?: string;
  expiresAt?: string;
}

interface VerificationCodeFormModalProps {
  open: boolean;
  isEdit: boolean;
  form: UseFormReturn<VerificationCodeFormValues>;
  saving: boolean;
  error: string;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onGenerateCode: () => void;
}

const STAFF_ROLES = [Role.ADMIN, Role.HOD, Role.LECTURER];

export function VerificationCodeFormModal({ open, isEdit, form, saving, error, onClose, onSubmit, onGenerateCode }: VerificationCodeFormModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); else {} }}>
      <DialogContent className="md:max-w-[500px]" onSwipeDown={() => onClose()}>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Verification Code" : "New Verification Code"}</DialogTitle>
          <DialogDescription>{isEdit ? "Update code details." : "Create a verification code for registration."}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={onSubmit} className={`space-y-4 transition-opacity ${saving ? "opacity-60" : ""}`}>
            {error && <ServerErrorBanner message={error} />}
            <FormField control={form.control} name="code" render={({ field }) => (
              <FormItem>
                <FormLabel>Code * (max 50 chars)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input placeholder="ROLE-YEAR-XXXXXX" className="pr-24 font-mono" maxLength={50} disabled={saving} {...field} />
                    <Button type="button" variant="outline" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={onGenerateCode} disabled={saving}>Generate</Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="role" render={({ field }) => (
              <FormItem>
                <FormLabel>Role *</FormLabel>
                <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description (max 200 chars)</FormLabel><FormControl><Input maxLength={200} disabled={saving} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="maxUsage" render={({ field }) => (
              <FormItem><FormLabel>Max usage (empty = unlimited)</FormLabel><FormControl><Input type="number" min={1} placeholder="Unlimited" disabled={saving} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="expiresAt" render={({ field }) => (
              <FormItem><FormLabel>Expiry date/time</FormLabel><FormControl><Input type="datetime-local" disabled={saving} {...field} value={field.value ?? ""} /></FormControl><FormMessage /></FormItem>
            )} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onClose()} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
