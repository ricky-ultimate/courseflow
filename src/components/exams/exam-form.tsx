"use client";

import { useRef, useState } from "react";
import { UseFormReturn } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ServerErrorBanner } from "@/components/ui/server-error-banner";
import { Info, Loader2, Search } from "lucide-react";
import { Course, College, VenueType, Level, ICT_VENUES } from "@/types";
import { VENUE_LABELS } from "@/lib/constants";

const REGULAR_VENUES = Object.values(VenueType).filter(
  (v) => !ICT_VENUES.includes(v),
);

function isCbtCourse(course: Course | null | undefined): boolean {
  if (!course) return false;
  return course.level === Level.LEVEL_100 || !!course.isGeneral;
}

function courseDisplayLabel(c: Course): string {
  return `${c.code} — ${c.name} (${c.level?.replace("LEVEL_", "") ?? ""})`;
}

interface ExamFormProps {
  form: UseFormReturn<any>;
  courses: Course[];
  submitting: boolean;
  error: string;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ExamForm({
  form,
  courses,
  submitting,
  error,
  submitLabel,
  onCancel,
  onSubmit,
}: ExamFormProps) {
  const [comboboxQuery, setComboboxQuery] = useState("");
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const courseCode = form.watch("courseCode");
  const selectedCourse = courses.find((c) => c.code === courseCode) ?? null;
  const isCbt = isCbtCourse(selectedCourse);

  const filteredCourses = courses
    .filter((c) => {
      const q = comboboxQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (c.code ?? "").toLowerCase().includes(q) ||
        (c.name ?? "").toLowerCase().includes(q)
      );
    })
    .slice(0, 50);

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className={`space-y-4 transition-opacity ${submitting ? "opacity-60" : ""}`}
      >
        {error && <ServerErrorBanner message={error} />}
        <FormField
          control={form.control}
          name="courseCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course *</FormLabel>
              <FormControl>
                <div ref={containerRef} className="relative">
                  <Input
                    className="pr-10"
                    placeholder="Search by code or name..."
                    value={
                      selectedCourse && !comboboxQuery
                        ? courseDisplayLabel(selectedCourse)
                        : comboboxQuery
                    }
                    onChange={(e) => {
                      setComboboxQuery(e.target.value);
                      if (selectedCourse) field.onChange("");
                      setComboboxOpen(true);
                    }}
                    onFocus={() => setComboboxOpen(true)}
                    onKeyDown={(e) =>
                      e.key === "Escape" && setComboboxOpen(false)
                    }
                    disabled={submitting}
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  {comboboxOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        aria-hidden
                        onClick={() => setComboboxOpen(false)}
                      />
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                        {filteredCourses.length === 0 ? (
                          <div className="px-3 py-6 text-center text-sm text-gray-500">
                            No courses match
                          </div>
                        ) : (
                          filteredCourses.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                              onClick={() => {
                                field.onChange(c.code);
                                setComboboxQuery("");
                                setComboboxOpen(false);
                              }}
                            >
                              {courseDisplayLabel(c)}
                            </button>
                          ))
                        )}
                      </div>
                    </>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {isCbt && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>CBT course (100L or General) — must use an ICT venue.</span>
          </div>
        )}
        <FormField
          control={form.control}
          name="venue"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Venue *</FormLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={submitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <div className="px-2 py-1.5 text-xs font-medium text-gray-500">
                    ICT Venues (Required for CBT)
                  </div>
                  {ICT_VENUES.map((v) => (
                    <SelectItem key={v} value={v}>
                      {VENUE_LABELS[v]}
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1.5 text-xs font-medium text-gray-500 mt-2">
                    Regular Venues
                  </div>
                  {REGULAR_VENUES.map((v) => (
                    <SelectItem key={v} value={v} disabled={isCbt}>
                      {VENUE_LABELS[v]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Exam date *</FormLabel>
                <FormControl>
                  <Input type="date" disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start time *</FormLabel>
                <FormControl>
                  <Input type="time" disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End time *</FormLabel>
                <FormControl>
                  <Input type="time" disabled={submitting} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="studentCount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student count *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  disabled={submitting}
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value, 10) : 1,
                    )
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {selectedCourse?.isGeneral && (
          <FormField
            control={form.control}
            name="targetCollege"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target college *</FormLabel>
                <Select
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  disabled={submitting}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select college" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value={College.CBAS}>CBAS</SelectItem>
                    <SelectItem value={College.CHMS}>CHMS</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <FormField
          control={form.control}
          name="invigilators"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Invigilators</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g. Dr. Smith, Prof. Jones"
                  disabled={submitting}
                  {...field}
                  value={field.value ?? ""}
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
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              submitLabel
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
