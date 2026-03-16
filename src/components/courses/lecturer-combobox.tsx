'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Role } from '@/types'

export interface LecturerOption {
  id: string
  name: string | null
  email: string
}

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0]! + parts[parts.length - 1]![0]!).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export interface LecturerComboboxProps {
  value: string
  onChange: (lecturerId: string) => void
  departmentCode?: string
  placeholder?: string
  disabled?: boolean
}

/** On department selection: getUsers({ role: 'LECTURER', departmentCode }). If no department: search across all lecturers. */
export function LecturerCombobox({
  value,
  onChange,
  departmentCode,
  placeholder = 'Search by name or email...',
  disabled,
}: LecturerComboboxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<LecturerOption[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      if (departmentCode) {
        const res = await apiClient.getUsers({ role: Role.LECTURER, departmentCode, limit: 100 })
        const r = getItemsFromResponse<LecturerOption>(res)
        setOptions(r?.items ?? [])
      } else {
        const res = await apiClient.getUsers({ role: Role.LECTURER, limit: 200 })
        const r = getItemsFromResponse<LecturerOption>(res)
        setOptions(r?.items ?? [])
      }
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [departmentCode])

  useEffect(() => {
    if (open || (value && options.length === 0)) {
      fetchCandidates()
    }
    // options.length intentionally omitted: including it would refetch when options populate
  }, [open, value, departmentCode, fetchCandidates]) // eslint-disable-line react-hooks/exhaustive-deps

  const q = query.trim().toLowerCase()
  const filtered =
    q.length >= 1
      ? options.filter((u) => {
          const name = (u.name ?? '').toLowerCase()
          const email = (u.email ?? '').toLowerCase()
          return name.includes(q) || email.includes(q)
        })
      : options

  const selected = options.find((u) => u.id === value)
  const displayValue = open ? query : (selected ? `${selected.name ?? selected.email} (${selected.email})` : '')

  const handleSelect = (id: string) => {
    onChange(id)
    setQuery('')
    setOpen(false)
  }

  const handleClear = () => {
    onChange('')
    setQuery('')
    setOpen(false)
  }

  const showHint = !departmentCode && q.length < 1
  const showOptions = departmentCode ? filtered : q.length >= 1 ? filtered : []

  return (
    <div ref={containerRef} className="relative">
      <Label className="sr-only">Lecturer</Label>
      <Input
        placeholder={placeholder}
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') setOpen(false)
        }}
        disabled={disabled}
        className="pr-8"
      />
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg max-h-48 overflow-y-auto">
            <button
              type="button"
              className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 first:rounded-t-lg focus:bg-gray-100 focus:outline-2 focus:outline-indigo-600 focus:outline-offset-2"
              onClick={handleClear}
            >
              <span className="text-gray-500 italic">No lecturer assigned</span>
            </button>
            {loading ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">Loading...</div>
            ) : showHint ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">Type to search (min 1 character)</div>
            ) : showOptions.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">No matches</div>
            ) : (
              showOptions.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  className="w-full px-3 py-2.5 text-left text-sm hover:bg-gray-100 focus:bg-gray-100 focus:outline-2 focus:outline-indigo-600 focus:outline-offset-2 flex items-center gap-2"
                  onClick={() => handleSelect(u.id)}
                >
                  <span className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700 shrink-0">
                    {getInitials(u.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">{u.name ?? u.email}</span>
                    <span className="text-gray-500 text-xs"> {u.email}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
