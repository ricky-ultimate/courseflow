"use client";

import { usePageLoadReporter } from "@/contexts/PageLoadContext";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  usePageLoadReporter(false);
  return (
    <div className="mx-auto max-w-[640px] px-6 py-6">
      <h1 className="text-2xl font-semibold">Settings</h1>
      <div className="mt-6 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
        <Settings className="h-16 w-16 text-gray-300" aria-hidden />
        <h2 className="mt-4 text-base font-semibold text-gray-700">Application Settings</h2>
        <p className="mt-2 text-sm text-gray-400">Settings and preferences will be available here.</p>
      </div>
    </div>
  );
}
