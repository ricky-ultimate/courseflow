'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api'
import { AcademicSession } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuViewport,
} from '@/components/ui/navigation-menu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  BookOpen,
  Calendar,
  MessageCircle,
  Settings,
  User,
  LogOut,
  Menu,
  Home,
  Building2,
  GraduationCap,
  ClipboardList,
  Users,
} from 'lucide-react'

export function Navigation() {
  const { user, logout, isAuthenticated, isAdmin, isLecturer, isHod } = useAuth()
  const isStaff = isAdmin || isLecturer || isHod
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [activeSession, setActiveSession] = useState<AcademicSession | null>(null)

  useEffect(() => {
    const fetchActiveSession = async () => {
      try {
        const response = await apiClient.getActiveAcademicSession()
        if (response.success && response.data != null) {
          const raw = response.data as { data?: AcademicSession } | AcademicSession
          const session = (raw as { data?: AcademicSession }).data ?? (raw as AcademicSession)
          setActiveSession(session?.id ? session : null)
        } else {
          setActiveSession(null)
        }
      } catch (error) {
        console.error('Failed to fetch active session:', error)
      }
    }
    fetchActiveSession()
  }, [])

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const navItems = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      show: isAuthenticated,
    },
    {
      title: 'Courses',
      href: '/courses',
      icon: BookOpen,
      show: true,
    },
    {
      title: 'Schedule',
      href: '/schedules',
      icon: Calendar,
      show: true,
    },
    {
      title: 'Departments',
      href: '/departments',
      icon: Building2,
      show: true,
    },
    {
      title: 'Complaints',
      href: '/complaints',
      icon: MessageCircle,
      show: isAuthenticated,
    },
  ]

  const adminItems = [
    {
      title: 'Users',
      href: '/lecturers',
      icon: Users,
      show: isAdmin,
    },
    {
      title: 'Academic Sessions',
      href: '/sessions',
      icon: Calendar,
      show: isAdmin,
    },
    {
      title: 'Exams',
      href: '/exams',
      icon: ClipboardList,
      show: isAdmin,
    },
    {
      title: 'Verification Codes',
      href: '/verification-codes',
      icon: ClipboardList,
      show: isAdmin,
    },
  ]

  const MobileNavigation = () => (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80">
        <SheetHeader>
          <SheetTitle className="text-left">
            <Link href="/" className="flex items-center space-x-2">
              <GraduationCap className="h-6 w-6" />
              <span className="text-xl font-bold">CourseFlow</span>
            </Link>
          </SheetTitle>
        </SheetHeader>
        <div className="flex flex-col space-y-3 mt-6">
          {navItems.filter(item => item.show).map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                pathname === item.href
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent hover:text-accent-foreground'
              }`}
              onClick={() => setIsOpen(false)}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}

          {isStaff && (
            <>
              <div className="border-t pt-3">
                <p className="px-3 text-sm font-medium text-muted-foreground mb-2">
                  {isAdmin ? 'Admin' : isHod ? 'HOD' : 'Lecturer'}
                </p>
                {adminItems.filter(item => item.show).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
                      pathname === item.href
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent hover:text-accent-foreground'
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
                ))}
              </div>
            </>
          )}

          {isAuthenticated && (
            <div className="border-t pt-3">
              <div className="px-3 py-2">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <Badge variant="secondary" className="text-xs mt-1">
                  {user?.role}
                </Badge>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start px-3"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <div className="relative">
              <GraduationCap className="h-7 w-7 text-primary group-hover:scale-110 transition-transform" />
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              CourseFlow
            </span>
          </Link>

          {/* Active Session Badge */}
          {activeSession && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md bg-primary/10 text-primary text-sm font-medium">
              <Calendar className="h-4 w-4" />
              <span>Current Session: {activeSession.name}</span>
            </div>
          )}

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navItems.filter(item => item.show).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-1.5 text-sm font-medium transition-all px-3 py-2 rounded-lg ${
                  pathname === item.href
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </Link>
            ))}

            {isStaff && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    {isAdmin ? 'Admin' : isHod ? 'HOD' : 'Lecturer'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {adminItems.filter(item => item.show).map((item) => (
                    <DropdownMenuItem key={item.href} asChild>
                      <Link href={item.href} className="flex items-center">
                        <item.icon className="h-4 w-4 mr-2" />
                        {item.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                      <Badge variant="secondary" className="text-xs w-fit">
                        {user?.role}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="space-x-2 hidden md:flex">
                <Button variant="ghost" asChild>
                  <Link href="/login">Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            )}

            {/* Mobile Navigation */}
            <MobileNavigation />
          </div>
        </div>
      </div>
    </header>
  )
}
