import Link from 'next/link'
import { GraduationCap, BookOpen, Calendar, Building2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ReportPageLoadOnMount } from '@/components/page-load-reporter'

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <ReportPageLoadOnMount />

      <header className="border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-indigo-600" />
            <span className="font-semibold text-gray-900">CourseFlow</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-600 text-sm font-medium mb-6">
          <GraduationCap className="h-4 w-4" />
          University Academic Management
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 tracking-tight mb-4">
          CourseFlow
        </h1>
        <p className="text-xl text-gray-500 max-w-lg mx-auto mb-10">
          Courses, timetables, and departments — all in one place.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8" asChild>
            <Link href="/courses">
              Browse Courses
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" className="px-8" asChild>
            <Link href="/login">Sign in to your account</Link>
          </Button>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/courses"
            className="group flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
              <BookOpen className="h-5 w-5 text-blue-600 group-hover:text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Courses</p>
              <p className="text-sm text-gray-500 mt-0.5">Browse the full course catalog</p>
            </div>
          </Link>

          <Link
            href="/schedules"
            className="group flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
              <Calendar className="h-5 w-5 text-green-600 group-hover:text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Schedules</p>
              <p className="text-sm text-gray-500 mt-0.5">View the academic timetable</p>
            </div>
          </Link>

          <Link
            href="/departments"
            className="group flex items-start gap-4 p-5 rounded-xl border border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/50 transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 transition-colors">
              <Building2 className="h-5 w-5 text-purple-600 group-hover:text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Departments</p>
              <p className="text-sm text-gray-500 mt-0.5">Explore academic departments</p>
            </div>
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} CourseFlow
      </footer>
    </div>
  )
}
