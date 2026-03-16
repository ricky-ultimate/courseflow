"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Calendar,
  Building2,
  BookOpen,
  GraduationCap,
  Users,
  Clock,
  ClipboardList,
  MessageCircle,
  KeyRound,
  Settings,
  X,
  Activity,
} from "lucide-react";
import { Role } from "@/types";
import { cn } from "@/lib/utils";

const ROLE_BADGE_COLORS: Record<Role, string> = {
  [Role.ADMIN]: "bg-indigo-100 text-indigo-700",
  [Role.HOD]: "bg-violet-100 text-violet-700",
  [Role.LECTURER]: "bg-sky-100 text-sky-700",
  [Role.STUDENT]: "bg-emerald-100 text-emerald-700",
};

function getInitials(name: string | null, email: string): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return (parts[0][0] || "").toUpperCase();
  }
  return (email[0] || "?").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-violet-500",
  "bg-blue-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

function getAvatarColor(name: string | null, email: string): string {
  const str = (name || email) || "user";
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  visibleTo: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, visibleTo: [Role.ADMIN, Role.HOD, Role.LECTURER, Role.STUDENT] },
  { label: "Academic Sessions", href: "/sessions", icon: Calendar, visibleTo: [Role.ADMIN] },
  { label: "Departments", href: "/departments", icon: Building2, visibleTo: [Role.ADMIN, Role.HOD, Role.LECTURER, Role.STUDENT] },
  { label: "Courses", href: "/courses", icon: BookOpen, visibleTo: [Role.ADMIN, Role.HOD, Role.LECTURER, Role.STUDENT] },
  { label: "Lecturers", href: "/lecturers", icon: GraduationCap, visibleTo: [Role.ADMIN, Role.HOD] },
  { label: "Students", href: "/students", icon: Users, visibleTo: [Role.ADMIN, Role.HOD] },
  { label: "Schedules", href: "/schedules", icon: Clock, visibleTo: [Role.ADMIN, Role.HOD, Role.LECTURER, Role.STUDENT] },
  { label: "Exams", href: "/exams", icon: ClipboardList, visibleTo: [Role.ADMIN, Role.HOD, Role.LECTURER, Role.STUDENT] },
  { label: "Complaints", href: "/complaints", icon: MessageCircle, visibleTo: [Role.ADMIN, Role.HOD, Role.LECTURER, Role.STUDENT] },
  { label: "Verification Codes", href: "/verification-codes", icon: KeyRound, visibleTo: [Role.ADMIN] },
  { label: "Health", href: "/health", icon: Activity, visibleTo: [Role.ADMIN] },
];

export function Sidebar({
  isOpen,
  onClose,
  isMobile,
}: {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = NAV_ITEMS.filter((item) =>
    user ? item.visibleTo.includes(user.role) : false
  );

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Close drawer when viewport crosses 640px (sm breakpoint)
  useEffect(() => {
    if (!isMobile || !isOpen || !onClose) return;
    const handler = () => {
      if (window.innerWidth >= 640) onClose();
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [isMobile, isOpen, onClose]);

  const navContent = (
    <>
      {/* Mobile: user panel at top */}
      {isMobile && user && (
        <div className="flex items-center gap-3 p-4 border-b">
          <div
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full text-white font-medium text-sm",
              getAvatarColor(user.name, user.email)
            )}
          >
            {getInitials(user.name, user.email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{user.name || user.email}</p>
            <span
              className={cn(
                "inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5",
                ROLE_BADGE_COLORS[user.role] ?? "bg-gray-100 text-gray-700"
              )}
            >
              {user.role}
            </span>
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} className="min-w-[44px] min-h-[44px]">
              <X className="h-5 w-5" />
            </Button>
          )}
        </div>
      )}

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className={cn("space-y-1", isMobile ? "px-2" : "px-2 sm:px-0 sm:flex sm:flex-col sm:items-center lg:items-stretch lg:px-2")}>
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={isMobile ? onClose : undefined}
                title={!isMobile ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md text-sm font-medium transition-colors touch-manipulation",
                  isMobile ? "px-5 py-3.5 min-h-[44px]" : "px-3 py-2 sm:justify-center sm:px-0 sm:py-3.5 lg:justify-start lg:py-3 lg:px-4",
                  isActive
                    ? "bg-indigo-50 text-indigo-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive && "text-indigo-600")} />
                <span className={cn(!isMobile && "hidden lg:inline")}>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom: Settings + Sign out (desktop only, pinned) */}
      <div className={cn("border-t p-4", isMobile ? "hidden" : "hidden lg:block")}>
        <Link
          href="/settings"
          title="Settings"
          className={cn(
            "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 lg:justify-start",
            pathname === "/settings" && "bg-indigo-50 text-indigo-600"
          )}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span className="hidden lg:inline">Settings</span>
        </Link>
        {user && (
          <div className="mt-2 px-3 py-2 hidden lg:block">
            <p className="text-sm font-medium truncate">{user.name || user.email}</p>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 mt-1"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );

  if (isMobile) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 sm:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
        <aside
          className={cn(
            "fixed top-0 left-0 z-[60] h-full w-[min(80vw,300px)] bg-white border-r border-gray-200 flex flex-col transition-transform duration-250 ease-out sm:hidden",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {navContent}
        </aside>
      </>
    );
  }

  return (
    <aside className="hidden sm:flex sm:flex-col fixed left-0 top-14 h-[calc(100vh-56px)] w-12 lg:w-60 bg-white border-r border-gray-200 z-40 overflow-y-auto transition-[width]">
      {navContent}
    </aside>
  );
}
