"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/layout/app-shell";
import { Role } from "@/types";

const ROUTE_ROLES: Record<string, Role[]> = {
  "/sessions": [Role.ADMIN],
  "/lecturers": [Role.ADMIN, Role.HOD],
  "/students": [Role.ADMIN, Role.HOD],
  "/verification-codes": [Role.ADMIN],
  "/health": [Role.ADMIN],
  "/courses/create": [Role.ADMIN, Role.HOD],
  "/schedules/create": [Role.ADMIN, Role.HOD],
  "/departments/create": [Role.ADMIN],
};

function getBasePath(pathname: string): string | null {
  for (const route of Object.keys(ROUTE_ROLES)) {
    if (pathname === route || pathname.startsWith(route + "/")) return route;
  }
  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    const basePath = getBasePath(pathname);
    if (basePath && user) {
      const allowed = ROUTE_ROLES[basePath];
      if (allowed && !allowed.includes(user.role)) {
        router.replace("/dashboard");
      }
    }
  }, [isAuthenticated, loading, pathname, user, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col gap-4 w-48">
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <AppShell>{children}</AppShell>;
}
