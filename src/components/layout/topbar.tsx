"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Role } from "@/types";
import { Menu, Bell, User, LogOut } from "lucide-react";
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
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
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

export function Topbar({
  onMenuClick,
  className,
}: {
  onMenuClick?: () => void;
  className?: string;
}) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileUserSheetOpen, setMobileUserSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const openMobileUserSheet = () => setMobileUserSheetOpen(true);
  const closeMobileUserSheet = () => setMobileUserSheetOpen(false);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 h-14 z-50 bg-white border-b border-gray-200",
        className
      )}
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left: Hamburger (mobile) or CourseFlow (desktop) */}
        <div className="flex items-center shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden min-w-[44px] min-h-[44px] touch-manipulation"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <Link
            href="/dashboard"
            className="hidden sm:inline font-semibold text-lg text-indigo-600 hover:text-indigo-700 focus:outline focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
          >
            CourseFlow
          </Link>
        </div>

        {/* Center: CourseFlow (mobile only) */}
        <div className="flex-1 flex justify-center min-w-0 sm:hidden">
          <Link
            href="/dashboard"
            className="font-semibold text-lg text-indigo-600 hover:text-indigo-700 focus:outline focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
          >
            CourseFlow
          </Link>
        </div>

        {/* Right: Desktop - bell + role + avatar dropdown | Mobile - avatar (opens bottom sheet) */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Desktop: notification + role badge + avatar dropdown */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="min-w-[44px] min-h-[44px] touch-manipulation"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5 text-gray-500" />
            </Button>
            {user && (
              <span
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-medium",
                  ROLE_BADGE_COLORS[user.role] ?? "bg-gray-100 text-gray-700"
                )}
              >
                {user.role}
              </span>
            )}
          </div>

          {/* User avatar: dropdown (desktop) or bottom sheet (mobile) */}
          {user && (
            <>
              {/* Mobile: avatar opens bottom sheet */}
              <button
                onClick={openMobileUserSheet}
                className={cn(
                  "sm:hidden flex items-center justify-center min-w-[44px] min-h-[44px] w-8 h-8 rounded-full text-white font-medium text-sm touch-manipulation",
                  getAvatarColor(user.name, user.email)
                )}
                aria-label="User menu"
              >
                {getInitials(user.name, user.email)}
              </button>
              <Sheet open={mobileUserSheetOpen} onOpenChange={setMobileUserSheetOpen}>
                <SheetContent side="bottom" className="rounded-t-2xl">
                  <SheetHeader>
                    <SheetTitle className="sr-only">User menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-1 py-4">
                    <Link
                      href="/profile"
                      onClick={closeMobileUserSheet}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-900 font-medium min-h-[44px]"
                    >
                      <User className="h-5 w-5 text-gray-500" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => { closeMobileUserSheet(); handleLogout(); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-red-600 font-medium min-h-[44px] text-left w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </div>
                </SheetContent>
              </Sheet>

              {/* Desktop: avatar dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-white font-medium text-sm",
                      getAvatarColor(user.name, user.email)
                    )}
                    aria-label="User menu"
                  >
                    {getInitials(user.name, user.email)}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[180px]">
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      My Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
