'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ServerErrorBanner } from '@/components/ui/server-error-banner'
import { useAuth } from '@/contexts/AuthContext'
import { HodCombobox } from '@/components/departments/hod-combobox'
import { usePageLoadReporter } from '@/contexts/PageLoadContext'
import { useToast } from '@/hooks/use-toast'
import { Building2, ArrowLeft, Loader2 } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { College } from '@/types'

const createDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  code: z.string().min(1, 'Department code is required').regex(/^[A-Z]{2,4}$/, 'Code must be 2–4 uppercase letters'),
  description: z.string().max(1000).optional(),
  college: z.nativeEnum(College),
  hodId: z.string().optional(),
})

type CreateDepartmentFormValues = z.infer<typeof createDepartmentSchema>

export default function CreateDepartmentPage() {
  const router = useRouter()
  const { isAuthenticated, isAdmin } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState('')
  usePageLoadReporter(false)

  const canCreate = isAdmin

  const form = useForm<CreateDepartmentFormValues>({
    resolver: zodResolver(createDepartmentSchema),
    mode: 'onBlur',
    defaultValues: {
      name: '',
      code: '',
      description: '',
      college: College.CBAS,
      hodId: '',
    },
  })

  useEffect(() => {
    if (!isAuthenticated || !canCreate) {
      router.replace(!isAuthenticated ? '/login' : '/dashboard')
      return
    }
  }, [isAuthenticated, canCreate, router])

  if (!isAuthenticated || !canCreate) {
    return null
  }

  const handleSubmit = form.handleSubmit(async (data) => {
    setServerError('')
    setLoading(true)
    try {
      const response = await apiClient.createDepartment({
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        description: data.description?.trim() || undefined,
        college: data.college,
        hodId: data.hodId || undefined,
      })

      if (response.success) {
        toast({ title: 'Department created successfully.' })
        router.push('/departments')
      } else {
        setServerError(response.error || 'Failed to create department')
      }
    } catch (error) {
      console.error('Create department failed:', error)
      setServerError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            Create Department
          </h1>
          <p className="text-muted-foreground">Add a new academic department to the system</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Department Information</CardTitle>
            <CardDescription>Enter the details for the new department</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={handleSubmit} className={`space-y-6 transition-opacity ${loading ? 'opacity-60' : ''}`}>
                {serverError && <ServerErrorBanner message={serverError} />}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Computer Science"
                            maxLength={100}
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Department Code *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., CS"
                            maxLength={4}
                            className="font-mono"
                            disabled={loading}
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase().slice(0, 4))}
                          />
                        </FormControl>
                        <FormDescription>2–4 uppercase letters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter department description..."
                            rows={3}
                            maxLength={1000}
                            disabled={loading}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="college"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>College *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={loading}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={College.CBAS}>CBAS</SelectItem>
                            <SelectItem value={College.CHMS}>CHMS</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="hodId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Head of Department (Optional)</FormLabel>
                        <FormControl>
                          <HodCombobox
                            value={field.value ?? ''}
                            onChange={field.onChange}
                            placeholder="Search by name..."
                            disabled={loading}
                          />
                        </FormControl>
                        <FormDescription>Automatically links Head of Department to this department</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Department'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
