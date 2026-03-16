'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useAuth } from '@/contexts/AuthContext'
import { useToast } from '@/hooks/use-toast'
import {
  Building2,
  Search,
  Upload,
  Download,
  Plus,
  MoreVertical,
  Lock,
  Unlock,
  Trash2,
  Filter,
  FileUp,
  X,
  Loader2,
} from 'lucide-react'
import { usePageLoadReporter } from '@/contexts/PageLoadContext'
import { RefetchIndicator } from '@/components/ui/refetch-indicator'
import { ServerErrorBanner } from '@/components/ui/server-error-banner'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Department, College, BulkOperationResult } from '@/types'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { ErrorState } from '@/components/state/error-state'
import { HodCombobox } from '@/components/departments/hod-combobox'
import { Pagination } from '@/components/ui/pagination'

const editDepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required').max(100),
  code: z.string().min(1, 'Department code is required').regex(/^[A-Z]{2,4}$/, 'Code must be 2–4 uppercase letters'),
  description: z.string().max(1000).optional(),
  college: z.nativeEnum(College),
  hodId: z.string().optional(),
})

type EditDepartmentFormValues = z.infer<typeof editDepartmentSchema>

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function DepartmentsPage() {
  const router = useRouter()
  const { isAdmin, user, isHod } = useAuth()
  const { toast } = useToast()

  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [refetching, setRefetching] = useState(false)
  const hasFetchedRef = useRef(false)
  usePageLoadReporter(loading)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [hasCourses, setHasCourses] = useState(false)
  const [withoutCourses, setWithoutCourses] = useState(false)
  const [limit, setLimit] = useState(25)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ type: 'success' | 'mixed'; summary: { successCount: number; errorCount: number }; errors?: Array<{ row: number; field: string; value: unknown; message: string }> } | null>(null)

  const FILE_SIZE_LIMIT = 5 * 1024 * 1024 // 5MB

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const handleFileSelect = (file: File | null) => {
    if (file && file.size > FILE_SIZE_LIMIT) {
      toast({ title: 'File too large. Max 5MB.', variant: 'destructive' })
      return
    }
    setSelectedFile(file)
    setUploadResult(null)
  }
  const [confirmAction, setConfirmAction] = useState<{ open: boolean; type: 'lock' | 'unlock' | 'delete'; dept: Department | null }>({ open: false, type: 'lock', dept: null })
  const [actionLoading, setActionLoading] = useState(false)
  const [editDept, setEditDept] = useState<Department | null>(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  const editForm = useForm<EditDepartmentFormValues>({
    resolver: zodResolver(editDepartmentSchema),
    mode: 'onBlur',
    defaultValues: { name: '', code: '', description: '', college: College.CBAS, hodId: '' },
  })
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [mobileDeptMenu, setMobileDeptMenu] = useState<Department | null>(null)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(t)
  }, [searchTerm])

  const fetchDepartments = useCallback(async () => {
    try {
      if (!hasFetchedRef.current) setLoading(true)
      else setRefetching(true)
      setFetchError(null)
      const params: Record<string, string | number | boolean> = {
        page,
        limit,
        ...(debouncedSearch && { searchTerm: debouncedSearch }),
        ...(hasCourses && { hasCourses: true }),
        ...(withoutCourses && { withoutCourses: true }),
      }
      const res = await apiClient.getDepartments(params)
      const result = getItemsFromResponse<Department>(res)
      if (result) {
        setDepartments(result.items)
        setTotalPages(result.totalPages)
        setTotal(result.total)
      }
    } catch {
      setFetchError('Failed to load departments')
      toast({ title: 'Failed to load departments', variant: 'destructive' })
    } finally {
      setLoading(false)
      setRefetching(false)
      hasFetchedRef.current = true
    }
  }, [page, limit, debouncedSearch, hasCourses, withoutCourses, toast])

  useEffect(() => {
    fetchDepartments()
  }, [fetchDepartments])

  const filterCount = [hasCourses, withoutCourses].filter(Boolean).length

  const handleDownloadTemplate = async () => {
    try {
      const res = await apiClient.getDepartmentsBulkTemplate()
      if (res.success && res.data) {
        const raw = res.data as unknown
        const blob = raw instanceof Blob ? raw : new Blob([typeof raw === 'string' ? raw : String(raw)], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'departments-template.csv'
        a.click()
        URL.revokeObjectURL(url)
        toast({ title: 'Template downloaded' })
      }
    } catch {
      toast({ title: 'Failed to download template', variant: 'destructive' })
    }
  }

  const handleBulkUpload = async () => {
    if (!selectedFile) return
    if (selectedFile.size > FILE_SIZE_LIMIT) {
      toast({ title: 'File too large. Max 5MB.', variant: 'destructive' })
      return
    }
    try {
      setIsUploading(true)
      setUploadResult(null)
      const res = await apiClient.uploadDepartmentsBulk(selectedFile)
      const data = res.data as BulkOperationResult<Department> | undefined
      const sum = data?.summary
      if (res.success && data) {
        const count = sum?.successCount ?? data?.created?.length ?? 0
        if (sum && sum.errorCount > 0) {
          setUploadResult({ type: 'mixed', summary: { successCount: sum.successCount, errorCount: sum.errorCount }, errors: data.errors })
          fetchDepartments()
        } else {
          setUploadResult({ type: 'success', summary: { successCount: count, errorCount: 0 } })
          fetchDepartments()
        }
      } else if (sum && (sum.successCount > 0 || sum.errorCount > 0)) {
        setUploadResult({ type: 'mixed', summary: { successCount: sum.successCount, errorCount: sum.errorCount }, errors: data?.errors })
        fetchDepartments()
      } else {
        toast({ title: (res as { error?: string }).error || 'Upload failed', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'Upload failed', variant: 'destructive' })
    } finally {
      setIsUploading(false)
    }
  }

  const closeUploadModal = () => {
    setIsUploadOpen(false)
    setSelectedFile(null)
    setUploadResult(null)
  }

  const handleConfirmAction = async (): Promise<boolean> => {
    const { dept, type } = confirmAction
    if (!dept) return false
    const prevLocked = dept.isScheduleLocked
    if (type === 'lock' || type === 'unlock') {
      setDepartments((prev) => prev.map((d) => (d.code === dept.code ? { ...d, isScheduleLocked: type === 'lock' } : d)))
    }
    try {
      setActionLoading(true)
      let res: { success?: boolean }
      if (type === 'lock') res = await apiClient.lockDepartmentSchedule(dept.code)
      else if (type === 'unlock') res = await apiClient.unlockDepartmentSchedule(dept.code)
      else res = await apiClient.deleteDepartment(dept.code)

      if (res.success) {
        if (type === 'lock') toast({ title: `Schedule locked for ${dept.name}.` })
        else if (type === 'unlock') toast({ title: `Schedule unlocked for ${dept.name}.` })
        else toast({ title: 'Department deleted.' })
        fetchDepartments()
        return true
      }
      if (type === 'lock' || type === 'unlock') {
        setDepartments((prev) => prev.map((d) => (d.code === dept.code ? { ...d, isScheduleLocked: prevLocked } : d)))
      }
      toast({ title: (res as any).error || 'Action failed', variant: 'destructive' })
      return false
    } catch {
      if (type === 'lock' || type === 'unlock') {
        setDepartments((prev) => prev.map((d) => (d.code === dept.code ? { ...d, isScheduleLocked: prevLocked } : d)))
      }
      toast({ title: 'Action failed', variant: 'destructive' })
      return false
    } finally {
      setActionLoading(false)
    }
  }

  const canLockUnlock = (d: Department) => isAdmin || (isHod && user?.departmentCode === d.code)

  return (
    <div className="space-y-4">
      {/* 6.1 Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Departments</h1>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <Button variant="ghost" size="sm" onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setIsUploadOpen(true); setUploadResult(null); setSelectedFile(null); }}>
                <Upload className="h-4 w-4 mr-2" />
                Upload CSV
              </Button>
              <Button size="sm" onClick={() => router.push('/departments/create')}>
                <Plus className="h-4 w-4 mr-2" />
                New Department
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 6.2 Filter bar */}
      <div className="rounded-xl border border-gray-200 bg-white p-3 md:py-3 md:px-5">
        <div className="flex flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-0 md:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 md:h-9"
            />
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant={hasCourses ? 'default' : 'outline'}
              size="sm"
              className="h-9"
              onClick={() => setHasCourses(!hasCourses)}
            >
              Has Courses
            </Button>
            <Button
              variant={withoutCourses ? 'default' : 'outline'}
              size="sm"
              className="h-9"
              onClick={() => setWithoutCourses(!withoutCourses)}
            >
              Without Courses
            </Button>
          </div>
          <Button
            variant="outline"
            className="md:hidden h-11 shrink-0"
            onClick={() => setFiltersOpen(true)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters {filterCount > 0 && `(${filterCount})`}
          </Button>
        </div>
      </div>

      {/* Mobile filters sheet */}
      <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
        <DialogContent className="md:max-w-[400px]" onSwipeDown={() => setFiltersOpen(false)}>
          <DialogHeader>
            <DialogTitle>Filters</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Has Courses</p>
              <Button variant={hasCourses ? 'default' : 'outline'} className="w-full rounded-full" onClick={() => setHasCourses(!hasCourses)}>
                {hasCourses ? 'On' : 'Off'}
              </Button>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Without Courses</p>
              <Button variant={withoutCourses ? 'default' : 'outline'} className="w-full rounded-full" onClick={() => setWithoutCourses(!withoutCourses)}>
                {withoutCourses ? 'On' : 'Off'}
              </Button>
            </div>
            <div>
              <p className="text-sm font-medium mb-2">Per page</p>
              <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); setFiltersOpen(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => setFiltersOpen(false)}>Apply</Button>
            <button type="button" className="text-sm text-gray-500 underline" onClick={() => { setHasCourses(false); setWithoutCourses(false); setLimit(25); setPage(1); setFiltersOpen(false); }}>Clear Filters</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 6.3 Departments grid */}
      {fetchError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <ErrorState entity="departments" onRetry={() => { setFetchError(null); fetchDepartments(); }} />
        </div>
      ) : loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="min-h-[160px] rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-12 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-1" />
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-4 bg-gray-200 rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : departments.length === 0 ? (
        <div className="relative rounded-xl border border-gray-200 p-12 text-center">
          {refetching && <RefetchIndicator />}
          <Building2 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-base font-semibold text-gray-700">No departments yet</h3>
          <p className="text-sm text-gray-400 mt-2">Add your first department to get started.</p>
          {isAdmin && (
            <Button className="mt-5" onClick={() => router.push('/departments/create')}>
              <Plus className="h-4 w-4 mr-2" />
              + New Department
            </Button>
          )}
        </div>
      ) : (
        <div className="relative grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          {refetching && <RefetchIndicator />}
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="group flex flex-col min-h-[160px] rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow duration-150 hover:shadow-md cursor-pointer"
              onClick={(e) => { if (!(e.target as HTMLElement).closest('[data-menu]')) router.push(`/departments/${dept.code}`); }}
            >
              <div className="flex items-start justify-between gap-2">
                <Badge variant="outline" className={dept.college === College.CBAS ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-purple-100 text-purple-700 border-purple-200'}>
                  {dept.college}
                </Badge>
                {dept.isScheduleLocked && (
                  <span title="Schedule locked">
                    <Lock className="h-4 w-4 text-amber-500" />
                  </span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mt-2">{dept.name}</h3>
              <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block mt-1">{dept.code}</span>
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{dept.description || '—'}</p>
              <div className="mt-auto pt-4 border-t flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {dept.hod ? (
                    <>
                      <span className="text-sm text-gray-500 shrink-0">HOD:</span>
                      <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700 shrink-0">
                        {getInitials(dept.hod.name)}
                      </div>
                      <span className="text-sm truncate">{dept.hod.name}</span>
                    </>
                  ) : (
                    <span className="text-sm text-gray-400 italic">No HOD assigned</span>
                  )}
                </div>
                <div data-menu>
                  <div className="hidden md:block">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button size="icon" variant="ghost" className="h-11 w-11 touch-manipulation">
                          <MoreVertical className="h-5 w-5" />
                          <span className="sr-only">Menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/departments/${dept.code}`)}>View Details</DropdownMenuItem>
                        {isAdmin && <DropdownMenuItem onClick={() => { setEditDept(dept); setEditError(''); editForm.reset({ name: dept.name, code: dept.code, description: dept.description ?? '', college: dept.college, hodId: dept.hodId ?? '' }); }}>Edit Department</DropdownMenuItem>}
                        {canLockUnlock(dept) && (
                          <>
                            <DropdownMenuSeparator />
                            {!dept.isScheduleLocked && (
                              <DropdownMenuItem onClick={() => setConfirmAction({ open: true, type: 'lock', dept })}>Lock Schedule</DropdownMenuItem>
                            )}
                            {dept.isScheduleLocked && (
                              <DropdownMenuItem onClick={() => setConfirmAction({ open: true, type: 'unlock', dept })}>Unlock Schedule</DropdownMenuItem>
                            )}
                          </>
                        )}
                        {isAdmin && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-red-600" onClick={() => setConfirmAction({ open: true, type: 'delete', dept })}>Delete Department</DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="md:hidden h-11 w-11 touch-manipulation"
                    onClick={(e) => { e.stopPropagation(); setMobileDeptMenu(dept); }}
                    aria-label="Actions"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6.3 Mobile department action sheet */}
      <Sheet open={!!mobileDeptMenu} onOpenChange={(o) => !o && setMobileDeptMenu(null)}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{mobileDeptMenu?.name ?? 'Department actions'}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 py-4">
            {mobileDeptMenu && (() => {
              const d = mobileDeptMenu
              const close = () => setMobileDeptMenu(null)
              return (
                <>
                  <button
                    type="button"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                    onClick={() => { router.push(`/departments/${d.code}`); close(); }}
                  >
                    View Details
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                      onClick={() => { setEditDept(d); setEditError(''); editForm.reset({ name: d.name, code: d.code, description: d.description ?? '', college: d.college, hodId: d.hodId ?? '' }); close(); }}
                    >
                      Edit Department
                    </button>
                  )}
                  {canLockUnlock(d) && (
                    <>
                      {!d.isScheduleLocked && (
                        <button
                          type="button"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                          onClick={() => { setConfirmAction({ open: true, type: 'lock', dept: d }); close(); }}
                        >
                          Lock Schedule
                        </button>
                      )}
                      {d.isScheduleLocked && (
                        <button
                          type="button"
                          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left w-full min-h-[52px] font-medium"
                          onClick={() => { setConfirmAction({ open: true, type: 'unlock', dept: d }); close(); }}
                        >
                          Unlock Schedule
                        </button>
                      )}
                    </>
                  )}
                  {isAdmin && (
                    <button
                      type="button"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600 text-left w-full min-h-[52px] font-medium"
                      onClick={() => { setConfirmAction({ open: true, type: 'delete', dept: d }); close(); }}
                    >
                      Delete Department
                    </button>
                  )}
                </>
              )
            })()}
          </div>
        </SheetContent>
      </Sheet>

      {/* Pagination — §17 */}
      {total > 0 && (
        <Pagination
          page={page}
          totalPages={Math.max(1, totalPages)}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(v) => { setLimit(v); setPage(1); }}
        />
      )}

      {/* Upload modal — desktop 480px, mobile bottom sheet */}
      <Dialog open={isUploadOpen} onOpenChange={(o) => { setIsUploadOpen(o); if (!o) { setSelectedFile(null); setUploadResult(null); } }}>
        <DialogContent className="md:max-w-[480px]" onSwipeDown={() => closeUploadModal()}>
          <DialogHeader>
            <DialogTitle>Upload Departments CSV</DialogTitle>
            <DialogDescription>Drop your CSV file here or click to browse. Accept .csv only. Max 5MB.</DialogDescription>
          </DialogHeader>

          {uploadResult ? (
            <div className="space-y-4 py-2">
              {uploadResult.type === 'success' ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                  <p className="font-medium">{uploadResult.summary.successCount} departments created successfully.</p>
                </div>
              ) : (
                <>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
                    <p className="font-medium">{uploadResult.summary.successCount} created, {uploadResult.summary.errorCount} failed.</p>
                  </div>
                  {uploadResult.errors && uploadResult.errors.length > 0 && (
                    <div className="rounded-lg border border-gray-200 overflow-hidden">
                      <div className="max-h-[240px] overflow-y-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 sticky top-0">
                            <tr>
                              <th className="p-2 text-left font-medium">Row</th>
                              <th className="p-2 text-left font-medium">Field</th>
                              <th className="p-2 text-left font-medium">Value</th>
                              <th className="p-2 text-left font-medium">Error Message</th>
                            </tr>
                          </thead>
                          <tbody>
                            {uploadResult.errors.map((err, i) => (
                              <tr key={i} className="border-t">
                                <td className="p-2">{err.row}</td>
                                <td className="p-2">{err.field}</td>
                                <td className="p-2 truncate max-w-[80px]">{String(err.value ?? '—')}</td>
                                <td className="p-2 text-red-600">{err.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              )}
              <DialogFooter>
                <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700" onClick={closeUploadModal}>Close</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className={isUploading ? 'opacity-60 pointer-events-none' : ''}>
                <div
                  className="border-2 border-dashed border-gray-300 rounded-xl p-10 text-center cursor-pointer hover:border-indigo-400 transition-colors"
                  onDragOver={(e) => !isUploading && e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); if (isUploading) return; const f = e.dataTransfer.files[0]; if (f?.name.toLowerCase().endsWith('.csv')) handleFileSelect(f); }}
                  onClick={() => !isUploading && document.getElementById('dept-csv-input')?.click()}
                >
                  <input
                    id="dept-csv-input"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    disabled={isUploading}
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
                  />
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <span className="text-sm text-gray-500">({formatFileSize(selectedFile.size)})</span>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleFileSelect(null); }}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Remove</span>
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <FileUp className="h-10 w-10 text-gray-400" />
                    <p className="text-sm text-gray-500">Drop your CSV file here or click to browse</p>
                  </div>
                )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  <button type="button" className="underline" onClick={handleDownloadTemplate}>Download template</button>
                </p>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeUploadModal} disabled={isUploading}>Cancel</Button>
                <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700" onClick={handleBulkUpload} disabled={!selectedFile || isUploading}>
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Upload'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm dialogs */}
      {/* Edit modal */}
      <Dialog open={!!editDept} onOpenChange={(o) => !o && setEditDept(null)}>
        <DialogContent className="md:max-w-[520px]" onSwipeDown={() => setEditDept(null)}>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>Update department details.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(async (data) => {
                if (!editDept) return
                setEditError('')
                try {
                  setEditSaving(true)
                  const res = await apiClient.updateDepartment(editDept.code, {
                    name: data.name,
                    code: data.code,
                    description: data.description || undefined,
                    college: data.college,
                    hodId: data.hodId || undefined,
                  })
                  if (res.success) {
                    toast({ title: 'Department updated.' })
                    setEditDept(null)
                    fetchDepartments()
                  } else {
                    setEditError((res as { error?: string }).error ?? 'Failed to update')
                  }
                } catch {
                  setEditError('Update failed')
                } finally {
                  setEditSaving(false)
                }
              })}
              className={`space-y-4 transition-opacity ${editSaving ? 'opacity-60' : ''}`}
            >
              {editError && <ServerErrorBanner message={editError} />}
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department name</FormLabel>
                    <FormControl>
                      <Input maxLength={100} disabled={editSaving} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department code</FormLabel>
                    <FormControl>
                      <Input className="font-mono" disabled={editSaving} {...field} onChange={(e) => field.onChange(e.target.value.toUpperCase().slice(0, 4))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} maxLength={1000} disabled={editSaving} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="college"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>College</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={editSaving}>
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
                control={editForm.control}
                name="hodId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Head of Department (Optional)</FormLabel>
                    <FormControl>
                      <HodCombobox
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        placeholder="Search by name..."
                        disabled={editSaving}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDept(null)} disabled={editSaving}>Cancel</Button>
                <Button type="submit" disabled={editSaving}>{editSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={confirmAction.open && confirmAction.type === 'lock'} onOpenChange={(o) => !o && setConfirmAction({ open: false, type: 'lock', dept: null })} title="Lock schedule?" description={`Lock the schedule for ${confirmAction.dept?.name}. No changes can be made until unlocked.`} icon={Lock} iconClassName="bg-amber-500 text-white" confirmLabel="Lock" confirmClassName="bg-amber-600 hover:bg-amber-700 text-white" onConfirm={handleConfirmAction} loading={actionLoading} />
      <ConfirmDialog open={confirmAction.open && confirmAction.type === 'unlock'} onOpenChange={(o) => !o && setConfirmAction({ open: false, type: 'unlock', dept: null })} title="Unlock schedule?" description={`Unlock the schedule for ${confirmAction.dept?.name}.`} icon={Unlock} iconClassName="bg-green-500 text-white" confirmLabel="Unlock" confirmClassName="bg-green-600 hover:bg-green-700 text-white" onConfirm={handleConfirmAction} loading={actionLoading} />
      <ConfirmDialog open={confirmAction.open && confirmAction.type === 'delete'} onOpenChange={(o) => !o && setConfirmAction({ open: false, type: 'delete', dept: null })} title="Delete department?" description={`This will permanently deactivate ${confirmAction.dept?.name}. Courses in this department will not be deleted but the department will no longer appear in listings.`} icon={Trash2} iconClassName="bg-red-500 text-white" confirmLabel="Delete" confirmVariant="destructive" onConfirm={handleConfirmAction} loading={actionLoading} />
    </div>
  )
}
