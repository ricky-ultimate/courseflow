"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Role } from "@/types";
import { Menu, Bell, User, LogOut } from "lucide-react";
import { cn, getInitials, getAvatarColor } from "@/lib/utils";
import { ROLE_BADGE_COLORS } from "@/lib/constants";

export function Topbar({ onMenuClick, className }: { onMenuClick?: () => void; className?: string }) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mobileUserSheetOpen, setMobileUserSheetOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className={cn("fixed top-0 left-0 right-0 h-14 z-50 bg-white border-b border-gray-200", className)}>
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
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

        <div className="flex-1 flex justify-center min-w-0 sm:hidden">
          <Link
            href="/dashboard"
            className="font-semibold text-lg text-indigo-600 hover:text-indigo-700 focus:outline focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-md"
          >
            CourseFlow
          </Link>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-3">
            <Button variant="ghost" size="icon" className="min-w-[44px] min-h-[44px] touch-manipulation" aria-label="Notifications">
              <Bell className="h-5 w-5 text-gray-500" />
            </Button>
            {user && (
              <span className={cn("px-2.5 py-1 rounded-full text-xs font-medium", ROLE_BADGE_COLORS[user.role] ?? "bg-gray-100 text-gray-700")}>
                {user.role}
              </span>
            )}
          </div>

          {user && (
            <>
              <button
                onClick={() => setMobileUserSheetOpen(true)}
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
                  <SheetHeader><SheetTitle className="sr-only">User menu</SheetTitle></SheetHeader>
                  <div className="flex flex-col gap-1 py-4">
                    <Link
                      href="/profile"
                      onClick={() => setMobileUserSheetOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-gray-900 font-medium min-h-[44px]"
                    >
                      <User className="h-5 w-5 text-gray-500" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => { setMobileUserSheetOpen(false); handleLogout(); }}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-red-600 font-medium min-h-[44px] text-left w-full"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </div>
                </SheetContent>
              </Sheet>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn("hidden sm:flex items-center justify-center w-8 h-8 rounded-full text-white font-medium text-sm", getAvatarColor(user.name, user.email))}
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
