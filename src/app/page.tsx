import Link from 'next/link'
import { ReportPageLoadOnMount } from '@/components/page-load-reporter'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Calendar, MessageCircle, Building2, Users, Clock, GraduationCap, CheckCircle2, Sparkles } from 'lucide-react'

export default function Home() {
  const features = [
    {
      icon: BookOpen,
      title: 'Course Catalog',
      description: 'Explore comprehensive course listings across all departments with detailed descriptions, prerequisites, and credit information.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
    },
    {
      icon: Calendar,
      title: 'Academic Schedule',
      description: 'Access your personalized timetable with real-time updates. View class times, venues, and instructor information.',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
    },
    {
      icon: Building2,
      title: 'Department Directory',
      description: 'Browse academic departments, discover course offerings, and connect with departmental resources and faculty.',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-950/20',
    },
    {
      icon: MessageCircle,
      title: 'Support System',
      description: 'Submit inquiries and track support requests with a transparent, organized complaint management system.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-950/20',
    },
    {
      icon: Users,
      title: 'User Administration',
      description: 'Comprehensive administrative tools for managing user accounts, roles, and system access permissions.',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/20',
    },
    {
      icon: Clock,
      title: 'Live Updates',
      description: 'Receive instant notifications about schedule changes, new course announcements, and important academic updates.',
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
    },
  ]

  const benefits = [
    'Centralized course information',
    'Real-time schedule updates',
    'Easy department navigation',
    'Streamlined support system',
    'Role-based access control',
    'Modern, intuitive interface',
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
      <ReportPageLoadOnMount />
      <Navigation />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl -z-10"></div>
        
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            <span>Academic Management System</span>
          </div>
          
          <div className="flex items-center justify-center gap-3 mb-4">
            <GraduationCap className="h-12 w-12 md:h-16 md:w-16 text-primary" />
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-gradient-to-r from-primary via-blue-600 to-primary bg-clip-text text-transparent">
              CourseFlow
            </h1>
          </div>
          
          <p className="text-2xl md:text-3xl font-semibold text-foreground/90 max-w-2xl mx-auto">
            Your Academic Journey, Perfectly Organized
          </p>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Streamline your academic experience with our comprehensive course management platform. 
            Access schedules, browse courses, manage departments, and stay connected throughout your educational journey.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
            <Button asChild size="lg" className="text-lg px-8 py-6 h-auto">
              <Link href="/courses">
                <BookOpen className="mr-2 h-5 w-5" />
                Explore Courses
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto border-2" asChild>
              <Link href="/schedules">
                <Calendar className="mr-2 h-5 w-5" />
                View Schedule
              </Link>
            </Button>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-12 pt-12 border-t">
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-2 text-sm md:text-base text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Comprehensive Features
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Everything you need to excel in your academic journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="transition-all hover:shadow-xl hover:scale-[1.02] border-2 hover:border-primary/20 group"
            >
              <CardHeader className="pb-3">
                <div className={`w-14 h-14 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <CardTitle className="text-xl font-semibold">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-gradient-to-br from-primary via-blue-600 to-primary text-primary-foreground border-0 shadow-2xl">
          <CardContent className="text-center py-16 px-8">
            <GraduationCap className="h-16 w-16 mx-auto mb-6 opacity-90" />
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to Begin Your Academic Journey?
            </h2>
            <p className="text-xl mb-10 opacity-95 max-w-2xl mx-auto">
              Join CourseFlow today and experience a streamlined, organized approach to managing your academic life. 
              Get started in seconds and take control of your schedule.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="secondary" size="lg" asChild className="text-lg px-8 py-6 h-auto">
                <Link href="/register">
                  <Users className="mr-2 h-5 w-5" />
                  Create Account
                </Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                asChild 
                className="text-lg px-8 py-6 h-auto border-2 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 backdrop-blur-sm"
              >
                <Link href="/login">
                  Sign In to Continue
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

    </div>
  )
}
