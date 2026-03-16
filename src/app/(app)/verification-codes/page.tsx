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
import { VerificationCode, Role, CreateVerificationCodeData } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Clipboard,
  Loader2,
  MoreVertical,
  Pencil,
  Plus,
  Power,
  KeyRound,
  Trash2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { ServerErrorBanner } from '@/components/ui/server-error-banner'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/state/error-state'

const verificationCodeSchema = z.object({
  code: z.string().min(1, 'Code is required').max(50, 'Code max 50 chars'),
  role: z.nativeEnum(Role),
  description: z.string().max(200).optional(),
  maxUsage: z.string().optional().refine((s) => !s || (parseInt(s, 10) >= 1), 'Must be 1 or more'),
  expiresAt: z.string().optional(),
})

type VerificationCodeFormValues = z.infer<typeof verificationCodeSchema>

function formatExpiry(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function VerificationCodesPage() {
  const { isAdmin } = useAuth()
  const { toast } = useToast()

  const [codes, setCodes] = useState<VerificationCode[]>([])
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)
  const hasFetchedRef = useRef(false)
  usePageLoadReporter(loading)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState<VerificationCode | null>(null)
  const openForEditCodeIdRef = useRef<string | null>(null)
  const [deleteCode, setDeleteCode] = useState<VerificationCode | null>(null)
  const [saving, setSaving] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')

  const form = useForm<VerificationCodeFormValues>({
    resolver: zodResolver(verificationCodeSchema),
    mode: 'onBlur',
    defaultValues: {
      code: '',
      role: Role.LECTURER,
      description: '',
      maxUsage: '',
      expiresAt: '',
    },
  })

  const fetchCodes = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true)
      else setRefetching(true)
      setFetchError(null)
      const res = await apiClient.getVerificationCodes()
      const parsed = getItemsFromResponse<VerificationCode>(res)
      const items = parsed?.items ?? (Array.isArray((res as any)?.data) ? (res as any).data : [])
      setCodes(items)
    } catch {
      setFetchError('Failed to load verification codes')
      toast({ title: 'Failed to load verification codes', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefetching(false)
      hasFetchedRef.current = true
    }
  }, [toast])

  useEffect(() => {
    if (isAdmin) fetchCodes()
  }, [isAdmin, fetchCodes])

  const copyToClipboard = async (code: VerificationCode) => {
    try {
      await navigator.clipboard.writeText(code.code)
      setCopiedId(code.id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast({ title: 'Copy failed', variant: 'destructive' })
    }
  }

  const generateCode = () => {
    const rolePrefix = form.watch('role').toUpperCase()
    const year = new Date().getFullYear()
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let suffix = ''
    for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)]
    form.setValue('code', `${rolePrefix}-${year}-${suffix}`)
  }

  const closeModal = useCallback(() => {
    openForEditCodeIdRef.current = null
    setEditingCode(null)
    setIsModalOpen(false)
  }, [])

  const openCreate = () => {
    openForEditCodeIdRef.current = null
    setEditingCode(null)
    setSaveError('')
    form.reset({ code: '', role: Role.LECTURER, description: '', maxUsage: '', expiresAt: '' })
    setIsModalOpen(true)
  }

  const openEdit = async (c: VerificationCode) => {
    openForEditCodeIdRef.current = c.id
    setEditingCode(c)
    setSaveError('')
    form.reset({
      code: c.code,
      role: c.role,
      description: c.description ?? '',
      maxUsage: c.maxUsage != null ? String(c.maxUsage) : '',
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().slice(0, 16) : '',
    })
    setIsModalOpen(true)
    try {
      const res = await apiClient.getVerificationCodeById(c.id)
      if (openForEditCodeIdRef.current !== c.id) return
      if (res.success && res.data) {
        const fresh = res.data as VerificationCode
        setEditingCode(fresh)
        form.reset({
          code: fresh.code,
          role: fresh.role,
          description: fresh.description ?? '',
          maxUsage: fresh.maxUsage != null ? String(fresh.maxUsage) : '',
          expiresAt: fresh.expiresAt ? new Date(fresh.expiresAt).toISOString().slice(0, 16) : '',
        })
      }
    } catch {
      if (openForEditCodeIdRef.current === c.id) toast({ title: 'Failed to load code', variant: 'destructive' })
    }
  }

  const handleSave = form.handleSubmit(async (data) => {
    setSaveError('')
    try {
      setSaving(true)
      const payload: CreateVerificationCodeData = {
        code: data.code.trim(),
        role: data.role,
        description: data.description?.trim(),
        maxUsage: data.maxUsage && parseInt(data.maxUsage, 10) >= 1 ? parseInt(data.maxUsage, 10) : undefined,
        expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : undefined,
      }
      if (editingCode) {
        const res = await apiClient.updateVerificationCode(editingCode.id, payload)
        if (res.success) {
          toast({ title: 'Code updated.' })
          closeModal()
          fetchCodes()
        } else {
          setSaveError((res as { error?: string }).error ?? 'Failed to update')
        }
      } else {
        const res = await apiClient.createVerificationCode(payload)
if (res.success) {
        toast({ title: 'Code created.' })
        closeModal()
        fetchCodes()
        } else {
          setSaveError((res as { error?: string }).error ?? 'Failed to create')
        }
      }
    } catch {
      setSaveError('Save failed')
    } finally {
      setSaving(false)
    }
  })

  const handleToggleActive = async (c: VerificationCode) => {
    const prevActive = c.isActive
    setCodes((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: !x.isActive } : x)))
    try {
      setActionLoading(true)
      const res = await apiClient.updateVerificationCode(c.id, { isActive: !c.isActive })
      if (res.success) {
        toast({ title: prevActive ? 'Code deactivated.' : 'Code activated.' })
      } else {
        setCodes((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: prevActive } : x)))
        toast({ title: (res as any).error, variant: 'destructive' })
      }
    } catch {
      setCodes((prev) => prev.map((x) => (x.id === c.id ? { ...x, isActive: prevActive } : x)))
      toast({ title: 'Update failed', variant: 'destructive' })
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (): Promise<boolean> => {
    if (!deleteCode) return false
    try {
      setActionLoading(true)
      const res = await apiClient.deleteVerificationCode(deleteCode.id)
      if (res.success) {
        toast({ title: 'Code deleted.' })
        setDeleteCode(null)
        fetchCodes()
        return true
      }
      toast({ title: (res as any).error, variant: 'destructive' })
      return false
    } catch {
      toast({ title: 'Delete failed', variant: 'destructive' })
      return false
    } finally {
      setActionLoading(false)
    }
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-16">
        <KeyRound className="h-16 w-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p className="text-gray-500">Admin privileges required.</p>
      </div>
    )
  }

  const staffRoles = [Role.ADMIN, Role.HOD, Role.LECTURER]

  return (
    <div className="space-y-6">
      {/* 12.1 Page Layout */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Verification Codes</h1>
        <Button size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Code
        </Button>
      </div>

      {/* 12.2 Table */}
      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="verification codes" onRetry={() => { setFetchError(null); fetchCodes(); }} />
        </div>
      ) : loading ? (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr className="text-left text-sm text-gray-500">
                  <th className="p-3">Code</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Description</th>
                  <th className="p-3">Usage</th>
                  <th className="p-3">Expires</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created By</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <tr key={i} className="border-t">
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-24 font-mono" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-16" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-32" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-20" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-24" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-14" /></td>
                    <td className="p-3"><div className="h-6 bg-gray-200 animate-pulse rounded w-24" /></td>
                    <td className="p-3 text-right"><div className="h-8 bg-gray-200 animate-pulse rounded w-16 ml-auto" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : codes.length === 0 ? (
        <div className="relative rounded-xl border border-gray-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          <KeyRound className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No verification codes</h3>
          <p className="text-sm text-gray-400 mt-2">Create codes to allow staff registration.</p>
          <Button className="mt-5" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" />
            + New Code
          </Button>
        </div>
      ) : (
        <div className="relative">
          {refetching && <RefetchIndicator />}
          <div className="hidden md:block rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b">
                  <tr className="text-left text-sm text-gray-500">
                    <th className="p-3">Code</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Description</th>
                    <th className="p-3">Usage</th>
                    <th className="p-3">Expires</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Created By</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {codes.map((c) => (
                    <tr key={c.id} className="border-t hover:bg-gray-50">
                      <td className="p-3">
                        <div className="flex items-center gap-1">
                          <code className="font-mono text-sm">{c.code}</code>
                          <div className="relative inline-flex">
                            {copiedId === c.id && (
                              <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-10 animate-in fade-in duration-150">
                                Copied!
                              </span>
                            )}
                            <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" onClick={() => copyToClipboard(c)} title="Copy">
                              <Clipboard className="h-4 w-4" /><span className="sr-only">Copy</span>
                            </Button>
                          </div>
                        </div>
                      </td>
                      <td className="p-3"><Badge variant="secondary">{c.role}</Badge></td>
                      <td className="p-3 text-sm text-gray-600 max-w-[180px] truncate" title={c.description ?? ''}>{c.description ?? '—'}</td>
                      <td className="p-3">
                        {c.maxUsage != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (c.usageCount / c.maxUsage) * 100)}%` }} />
                            </div>
                            <span className="text-sm">{c.usageCount}/{c.maxUsage}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Unlimited</span>
                        )}
                      </td>
                      <td className="p-3 text-sm">{formatExpiry(c.expiresAt)}</td>
                      <td className="p-3">
                        <Badge className={c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                      </td>
                      <td className="p-3 text-sm text-gray-600">{c.creator?.name ?? c.createdBy ?? '—'}</td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-11 w-11" onClick={() => openEdit(c)}><Pencil className="h-5 w-5" /><span className="sr-only">Edit</span></Button>
                          <Button size="icon" variant="ghost" className={`h-11 w-11 ${c.isActive ? 'text-green-600' : 'text-gray-500'}`} onClick={() => handleToggleActive(c)} disabled={actionLoading}><Power className="h-5 w-5" /><span className="sr-only">Toggle</span></Button>
                          <Button size="icon" variant="ghost" className="h-11 w-11 text-red-600" onClick={() => setDeleteCode(c)}><Trash2 className="h-5 w-5" /><span className="sr-only">Delete</span></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {codes.map((c) => (
              <div key={c.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <code className="font-mono text-sm">{c.code}</code>
                    <div className="relative inline-flex">
                      {copiedId === c.id && (
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg z-10 animate-in fade-in duration-150">
                          Copied!
                        </span>
                      )}
                      <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0" onClick={() => copyToClipboard(c)} title="Copy">
                        <Clipboard className="h-4 w-4" /><span className="sr-only">Copy</span>
                      </Button>
                    </div>
                  </div>
                  <Badge variant="secondary">{c.role}</Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">{c.description ?? '—'}</p>
                <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                  {c.maxUsage != null ? (
                    <>
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden flex-1 shrink-0">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (c.usageCount / c.maxUsage) * 100)}%` }} />
                      </div>
                      <span>{c.usageCount}/{c.maxUsage}</span>
                    </>
                  ) : (
                    <span>Unlimited</span>
                  )}
                  <span>·</span>
                  <span>Expires: {formatExpiry(c.expiresAt)}</span>
                </div>
                <div className="border-t mt-3 pt-3 flex items-center justify-between">
                  <Badge className={c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>{c.isActive ? 'Active' : 'Inactive'}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" className="h-11 w-11 shrink-0"><MoreVertical className="h-5 w-5" /><span className="sr-only">Menu</span></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEdit(c)}>Edit</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleActive(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600" onClick={() => setDeleteCode(c)}>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 12.3 Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={(o) => { if (!o) closeModal(); else setIsModalOpen(o); }}>
        <DialogContent className="md:max-w-[500px]" onSwipeDown={() => closeModal()}>
          <DialogHeader>
            <DialogTitle>{editingCode ? 'Edit Verification Code' : 'New Verification Code'}</DialogTitle>
            <DialogDescription>{editingCode ? 'Update code details.' : 'Create a verification code for registration.'}</DialogDescription>
          </DialogHeader>
          <Form {...form}>
          <form onSubmit={handleSave} className={`space-y-4 transition-opacity ${saving ? "opacity-60" : ""}`}>
            {saveError && <ServerErrorBanner message={saveError} />}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code * (max 50 chars)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="ROLE-YEAR-XXXXXX" className="pr-24 font-mono" maxLength={50} disabled={saving} {...field} />
                      <Button type="button" variant="outline" size="sm" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={generateCode} disabled={saving}>Generate</Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={saving}>
                    <FormControl>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffRoles.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (max 200 chars)</FormLabel>
                  <FormControl>
                    <Input maxLength={200} disabled={saving} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="maxUsage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max usage (empty = unlimited)</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} placeholder="Unlimited" disabled={saving} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expiresAt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expiry date/time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" disabled={saving} {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => closeModal()} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
            </DialogFooter>
          </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteCode} onOpenChange={(o) => !o && setDeleteCode(null)} title="Delete verification code?" description="This cannot be undone." icon={Trash2} iconClassName="bg-red-500 text-white" confirmLabel="Delete" confirmVariant="destructive" onConfirm={handleDelete} loading={actionLoading} />
    </div>
  )
}
