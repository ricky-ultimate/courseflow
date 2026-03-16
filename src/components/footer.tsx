'use client'

import Link from 'next/link'
import { GraduationCap, BookOpen, Calendar, Building2, MessageCircle, Home, Users, ClipboardList, Settings } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

export function Footer() {
  const { isAuthenticated, isAdmin } = useAuth()

  const publicPages = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/courses', label: 'Courses', icon: BookOpen },
    { href: '/schedules', label: 'Schedules', icon: Calendar },
    { href: '/departments', label: 'Departments', icon: Building2 },
  ]

  const authPages = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/complaints', label: 'Complaints', icon: MessageCircle },
  ]

  const adminPages = [
    { href: '/lecturers', label: 'Lecturers', icon: Users },
    { href: '/sessions', label: 'Academic Sessions', icon: Calendar },
    { href: '/exams', label: 'Exams', icon: ClipboardList },
    { href: '/verification-codes', label: 'Verification Codes', icon: Settings },
  ]

  return (
    <footer className="border-t bg-slate-100/50 dark:bg-slate-900/50 backdrop-blur-sm mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">CourseFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your comprehensive academic management system for modern education.
            </p>
          </div>
          
          {/* Public Pages */}
          <div>
            <h3 className="font-semibold mb-4">Public Pages</h3>
            <ul className="space-y-2 text-sm">
              {publicPages.map((page) => {
                const Icon = page.icon
                return (
                  <li key={page.href}>
                    <Link 
                      href={page.href} 
                      className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{page.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Authenticated Pages */}
          {isAuthenticated && (
            <div>
              <h3 className="font-semibold mb-4">My Account</h3>
              <ul className="space-y-2 text-sm">
                {authPages.map((page) => {
                  const Icon = page.icon
                  return (
                    <li key={page.href}>
                      <Link 
                        href={page.href} 
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{page.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {/* Admin Pages */}
          {isAdmin && (
            <div>
              <h3 className="font-semibold mb-4">Admin</h3>
              <ul className="space-y-2 text-sm">
                {adminPages.map((page) => {
                  const Icon = page.icon
                  return (
                    <li key={page.href}>
                      <Link 
                        href={page.href} 
                        className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{page.label}</span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
        
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} CourseFlow. All rights reserved.</p>
          <p className="mt-2">Empowering academic excellence through intelligent organization.</p>
        </div>
      </div>
    </footer>
  )
}

