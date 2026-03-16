'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { usePageLoadReporter } from '@/contexts/PageLoadContext'
import { RefetchIndicator } from '@/components/ui/refetch-indicator'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Complaint, ComplaintStatus } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MessageSquare, MessageSquareWarning, MoreVertical, Eye, Plus, Search, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ServerErrorBanner } from '@/components/ui/server-error-banner'
import { ErrorState } from '@/components/state/error-state'

const complaintSchema = z.object({
  name: z.string().min(1, 'Full name is required'),
  department: z.string().min(1, 'Department is required'),
  subject: z.string().min(5, 'Subject must be 5–200 characters').max(200, 'Subject must be 5–200 characters'),
  message: z.string().min(10, 'Message must be 10–1000 characters').max(1000, 'Message must be 10–1000 characters'),
})

type ComplaintFormValues = z.infer<typeof complaintSchema>

const STATUS_BADGES: Record<ComplaintStatus, string> = {
  [ComplaintStatus.PENDING]: 'bg-amber-100 text-amber-800',
  [ComplaintStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [ComplaintStatus.RESOLVED]: 'bg-green-100 text-green-800',
  [ComplaintStatus.CLOSED]: 'bg-gray-100 text-gray-800',
}

function formatRelative(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString()
}

export default function ComplaintsPage() {
  const { user, isAdmin, isHod } = useAuth()
  const { toast } = useToast()
  const isManager = isAdmin || isHod

  const [complaints, setComplaints] = useState<Complaint[]>([])
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)
  const hasFetchedRef = useRef(false)
  usePageLoadReporter(loading)
  const [activeTab, setActiveTab] = useState<'all' | ComplaintStatus>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [orderBy, setOrderBy] = useState<'newest' | 'oldest'>('newest')
  const [detailComplaint, setDetailComplaint] = useState<Complaint | null>(null)
  const [isSubmitOpen, setIsSubmitOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [statusLoading, setStatusLoading] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const complaintForm = useForm<ComplaintFormValues>({
    resolver: zodResolver(complaintSchema),
    mode: 'onBlur',
    defaultValues: {
      name: user?.name ?? '',
      department: '',
      subject: '',
      message: '',
    },
  })

  useEffect(() => {
    if (isSubmitOpen && user) {
      complaintForm.reset({
        name: user.name ?? '',
        department: '',
        subject: '',
        message: '',
      })
      setSubmitError('')
    }
  }, [isSubmitOpen, user?.id, user?.name, complaintForm, user])

  const fetchComplaints = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true)
      else setRefetching(true)
      setFetchError(null)
      if (isManager) {
        let res
        if (activeTab === 'all') {
          res = await apiClient.getComplaints({ page: 1, limit: 200, orderBy: 'createdAt', orderDirection: orderBy === 'newest' ? 'desc' : 'asc' })
        } else if (activeTab === ComplaintStatus.PENDING) {
          res = await apiClient.getPendingComplaints()
        } else if (activeTab === ComplaintStatus.RESOLVED) {
          res = await apiClient.getResolvedComplaints()
        } else {
          res = await apiClient.getComplaints({ page: 1, limit: 200, orderBy: 'createdAt', orderDirection: orderBy === 'newest' ? 'desc' : 'asc' })
        }
        const r = getItemsFromResponse<Complaint>(res)
        let items = r?.items ?? []
        if (activeTab === ComplaintStatus.IN_PROGRESS || activeTab === ComplaintStatus.CLOSED) {
          items = items.filter((c) => c.status === activeTab)
        }
        setComplaints(items)
      } else {
        const res = await apiClient.getMyComplaints()
        const data = (res as any)?.data
        const items = Array.isArray(data) ? data : (data?.data ?? [])
        setComplaints(items)
      }
    } catch {
      setFetchError('Failed to load complaints')
      toast({ title: 'Failed to load complaints', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefetching(false)
      hasFetchedRef.current = true
    }
  }, [isManager, orderBy, activeTab, toast])

  useEffect(() => {
    fetchComplaints()
  }, [fetchComplaints])

  const pendingCount = activeTab === 'all' ? complaints.filter((c) => c.status === ComplaintStatus.PENDING).length : (activeTab === ComplaintStatus.PENDING ? complaints.length : 0)

  const filteredComplaints = complaints.filter((c) => {
    if (isManager && activeTab !== 'all' && c.status !== activeTab) return false
    if (!searchTerm.trim()) return true
    const term = searchTerm.toLowerCase()
    const subj = (c.subject ?? '').toLowerCase()
    const name = (c.name ?? '').toLowerCase()
    return subj.includes(term) || name.includes(term)
  })

  const sortedComplaints = [...filteredComplaints].sort((a, b) => {
    const ta = new Date(a.createdAt).getTime()
    const tb = new Date(b.createdAt).getTime()
    return orderBy === 'newest' ? tb - ta : ta - tb
  })

  const handleSubmit = complaintForm.handleSubmit(async (data) => {
    setSubmitError('')
    if (!user?.email) return
    try {
      setSubmitting(true)
      const res = await apiClient.createComplaint({
        name: data.name,
        email: user.email,
        department: data.department,
        subject: data.subject,
        message: data.message,
      })
      if (res.success) {
        toast({ title: 'Your complaint has been submitted.' })
        setIsSubmitOpen(false)
        complaintForm.reset()
        fetchComplaints()
      } else {
        setSubmitError((res as { error?: string }).error || 'Submission failed')
      }
    } catch {
      setSubmitError('Submission failed')
    } finally {
      setSubmitting(false)
    }
  })

  const handleStatusChange = async (id: string, status: ComplaintStatus) => {
    try {
      setStatusLoading(id)
      const res = await apiClient.updateComplaintStatus(id, status)
      if (res.success) {
        const statusLabel = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
        toast({ title: `Complaint status updated to ${statusLabel}.` })
        setDetailComplaint((c) => (c?.id === id ? { ...c, status } : c))
        fetchComplaints()
      } else {
        toast({ title: (res as any).error, variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' })
    } finally {
      setStatusLoading(null)
    }
  }

  // ─── Student View (11.5, 11.6) ───────────────────────────────────────────
  if (!isManager) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold">My Complaints</h1>
          <Button size="sm" onClick={() => setIsSubmitOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Submit Complaint
          </Button>
        </div>

        {fetchError ? (
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <ErrorState entity="complaints" onRetry={() => { setFetchError(null); fetchComplaints(); }} />
          </div>
        ) : loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 animate-pulse">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded w-2/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-20 shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : complaints.length === 0 ? (
          <div className="relative rounded-xl border border-gray-200 p-12 text-center">
            {refetching && <RefetchIndicator />}
            <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-base font-semibold text-gray-700">You haven&apos;t submitted any complaints.</h3>
            <p className="text-sm text-gray-400 mt-2">Submit a complaint if you need assistance.</p>
            <Button className="mt-5" onClick={() => setIsSubmitOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              + Submit Complaint
            </Button>
          </div>
        ) : (
          <div className="relative space-y-3">
            {refetching && <RefetchIndicator />}
            {complaints.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:bg-gray-50"
                onClick={() => setDetailComplaint(c)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{c.subject}</p>
                    <p className="text-sm text-gray-500">{c.department} · {formatRelative(c.createdAt)}</p>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.message}</p>
                  </div>
                  <Badge className={STATUS_BADGES[c.status]}>{c.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 11.6 Submit Complaint Modal */}
        <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
          <DialogContent className="md:max-w-[520px]" onSwipeDown={() => setIsSubmitOpen(false)}>
            <DialogHeader>
              <DialogTitle>Submit Complaint</DialogTitle>
            </DialogHeader>
            <Form {...complaintForm}>
            <form onSubmit={handleSubmit} className={`space-y-4 transition-opacity ${submitting ? "opacity-60" : ""}`}>
              {submitError && <ServerErrorBanner message={submitError} />}
              <FormField
                control={complaintForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name *</FormLabel>
                    <FormControl>
                      <Input disabled={submitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={user?.email ?? ''} readOnly className="bg-gray-50" disabled={submitting} />
              </div>
              <FormField
                control={complaintForm.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Computer Science" disabled={submitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={complaintForm.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject * (5–200 chars)</FormLabel>
                    <FormControl>
                      <Input placeholder="Brief description" maxLength={200} disabled={submitting} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={complaintForm.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Message * (10–1000 chars)</FormLabel>
                    <FormControl>
                      <Textarea rows={5} maxLength={1000} disabled={submitting} {...field} />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">{field.value.length}/1000</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSubmitOpen(false)} disabled={submitting}>Cancel</Button>
                <Button type="submit" disabled={submitting}>{submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}</Button>
              </DialogFooter>
            </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Student detail (read-only) */}
        <Dialog open={!!detailComplaint} onOpenChange={(o) => !o && setDetailComplaint(null)}>
          <DialogContent className="md:max-w-[560px]" onSwipeDown={() => setDetailComplaint(null)}>
            {detailComplaint && (
              <>
                <DialogHeader>
                  <DialogTitle>{detailComplaint.subject}</DialogTitle>
                  <Badge className={STATUS_BADGES[detailComplaint.status]}>{detailComplaint.status.replace('_', ' ')}</Badge>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <span className="text-gray-500">Name</span><span>{detailComplaint.name}</span>
                    <span className="text-gray-500">Email</span><span>{detailComplaint.email}</span>
                    <span className="text-gray-500">Department</span><span>{detailComplaint.department}</span>
                    <span className="text-gray-500">Submitted</span><span>{new Date(detailComplaint.createdAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <Label>Message</Label>
                    <pre className="mt-1.5 max-h-[200px] overflow-y-auto rounded-lg border p-3 text-sm whitespace-pre-wrap">{detailComplaint.message}</pre>
                  </div>
                  {detailComplaint.resolvedAt && (
                    <p className="text-sm text-gray-500">Resolved by {detailComplaint.resolvedBy ?? 'admin'} on {new Date(detailComplaint.resolvedAt).toLocaleString()}</p>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ─── ADMIN/HOD View (11.2, 11.3, 11.4) ───────────────────────────────────
  const tabs: { value: 'all' | ComplaintStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: ComplaintStatus.PENDING, label: 'Pending' },
    { value: ComplaintStatus.IN_PROGRESS, label: 'In Progress' },
    { value: ComplaintStatus.RESOLVED, label: 'Resolved' },
    { value: ComplaintStatus.CLOSED, label: 'Closed' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Complaints</h1>

      {/* 11.2 Status tab bar (margin-top 16px per spec) */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 !mt-4">
        <div className="flex gap-1 border-b border-gray-200 min-w-max pb-px">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
                activeTab === t.value
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
              {t.value === ComplaintStatus.PENDING && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                  {activeTab === 'all' ? complaints.filter((c) => c.status === ComplaintStatus.PENDING).length : (activeTab === ComplaintStatus.PENDING ? complaints.length : 0)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 md:p-5">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search by subject or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
          </div>
          <Select value={orderBy} onValueChange={(v) => setOrderBy(v as 'newest' | 'oldest')}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 11.3 Complaints table */}
      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="complaints" onRetry={() => { setFetchError(null); fetchComplaints(); }} />
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  <th className="p-3">#</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Subject</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-6" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-28" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-24" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-40" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-20" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-24" /></td>
                    <td className="p-3 text-right"><div className="h-8 bg-gray-200 animate-pulse rounded w-16 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : sortedComplaints.length === 0 ? (
        <div className="relative rounded-xl border border-gray-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          {isManager ? (
            <>
              <MessageSquareWarning className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-base font-semibold text-gray-700">No complaints</h3>
              <p className="text-sm text-gray-400 mt-2">No complaints match the current filter.</p>
            </>
          ) : (
            <>
              <MessageSquare className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-base font-semibold text-gray-700">You haven&apos;t submitted any complaints.</h3>
              <p className="text-sm text-gray-400 mt-2">Submit a complaint if you need assistance.</p>
              <Button className="mt-5" onClick={() => setIsSubmitOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                + Submit Complaint
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-3">#</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Department</th>
                    <th className="p-3">Subject</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Submitted</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedComplaints.map((c, idx) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="p-3 text-sm text-gray-500">{idx + 1}</td>
                      <td className="p-3 text-sm">{c.name}</td>
                      <td className="p-3 text-sm">{c.email}</td>
                      <td className="p-3 text-sm">{c.department}</td>
                      <td className="p-3 text-sm max-w-[200px]" title={c.subject}>
                        {(c.subject ?? '').length > 40 ? `${c.subject!.slice(0, 40)}...` : c.subject}
                      </td>
                      <td className="p-3">
                        <Badge className={STATUS_BADGES[c.status]}>{c.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-500">{formatRelative(c.createdAt)}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => setDetailComplaint(c)}><Eye className="h-5 w-5" /><span className="sr-only">View</span></Button>
                          <Select value={c.status} onValueChange={(v) => handleStatusChange(c.id, v as ComplaintStatus)} disabled={statusLoading === c.id}>
                            <SelectTrigger className="w-[120px] h-11"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {Object.values(ComplaintStatus).map((s) => (
                                <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards — 11.3: subject + status row 1, name·dept, submitted, message, divider, [···] footer */}
          <div className="md:hidden space-y-3">
            {sortedComplaints.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold">{c.subject}</p>
                  <Badge className={`shrink-0 ${STATUS_BADGES[c.status]}`}>{c.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-sm text-gray-500 mt-1">{c.name} · {c.department}</p>
                <p className="text-xs text-gray-500">{formatRelative(c.createdAt)}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.message}</p>
                <div className="border-t mt-3 pt-3 flex justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0"><MoreVertical className="h-5 w-5" /><span className="sr-only">Menu</span></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setDetailComplaint(c)}>View detail</DropdownMenuItem>
                      {Object.values(ComplaintStatus).map((s) => (
                        <DropdownMenuItem key={s} onClick={() => handleStatusChange(c.id, s)}>{s.replace('_', ' ')}</DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 11.4 Complaint Detail Modal */}
      <Dialog open={!!detailComplaint} onOpenChange={(o) => !o && setDetailComplaint(null)}>
        <DialogContent className="md:max-w-[560px]" onSwipeDown={() => setDetailComplaint(null)}>
          {detailComplaint && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-2">
                  <DialogTitle className="text-lg">{detailComplaint.subject}</DialogTitle>
                  <Badge className={STATUS_BADGES[detailComplaint.status]}>{detailComplaint.status.replace('_', ' ')}</Badge>
                </div>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-500">Name</span><span>{detailComplaint.name}</span>
                  <span className="text-gray-500">Email</span><span>{detailComplaint.email}</span>
                  <span className="text-gray-500">Department</span><span>{detailComplaint.department}</span>
                  <span className="text-gray-500">Submitted</span><span>{new Date(detailComplaint.createdAt).toLocaleString()}</span>
                </div>
                <div>
                  <Label>Message</Label>
                  <pre className="mt-1.5 max-h-[200px] overflow-y-auto rounded-lg border p-3 text-sm whitespace-pre-wrap">{detailComplaint.message}</pre>
                </div>
                {detailComplaint.resolvedAt && (
                  <p className="text-sm text-gray-500">Resolved by {detailComplaint.resolvedBy ?? 'admin'} on {new Date(detailComplaint.resolvedAt).toLocaleString()}</p>
                )}
              </div>
              {isAdmin && (
                <DialogFooter>
                  <Select
                    value={detailComplaint.status}
                    onValueChange={(v) => handleStatusChange(detailComplaint.id, v as ComplaintStatus)}
                    disabled={statusLoading === detailComplaint.id}
                  >
                    <SelectTrigger className="h-11 w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.values(ComplaintStatus).map((s) => (
                        <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
