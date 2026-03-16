"use client";

import { useState } from "react";
import { Topbar } from "./topbar";
import { Sidebar } from "./sidebar";
import { ForbiddenBanner } from "@/components/ui/forbidden-banner";
import { useForbidden } from "@/contexts/ForbiddenContext";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const forbidden = useForbidden();

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isMobile={true}
      />
      <Sidebar isOpen={false} isMobile={false} />
      {/* Spacer for topbar (56px) + flex row for sidebar + content */}
      <div className="flex pt-14 min-h-screen">
        {/* Spacer: sidebar width on sm/lg so main content starts to the right */}
        <div className="hidden sm:block w-12 lg:w-60 shrink-0" />
        <main className="flex-1 min-w-0 px-4 sm:px-5 lg:px-8 py-4 lg:py-6">
          <div className="max-w-[1600px] mx-auto space-y-4">
            {forbidden?.forbidden && (
              <ForbiddenBanner onDismiss={() => forbidden.setForbidden(false)} />
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
