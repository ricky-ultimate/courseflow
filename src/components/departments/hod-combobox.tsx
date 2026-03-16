'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { apiClient } from '@/lib/api'
import { getItemsFromResponse } from '@/lib/utils'
import { Role } from '@/types'

export interface HodOption {
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

export interface HodComboboxProps {
  value: string
  onChange: (hodId: string) => void
  placeholder?: string
  disabled?: boolean
}

export function HodCombobox({ value, onChange, placeholder = 'Search by name...', disabled }: HodComboboxProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<HodOption[]>([])
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const fetchCandidates = useCallback(async () => {
    setLoading(true)
    try {
      const [hodRes, lecturerRes] = await Promise.all([
        apiClient.getUsers({ role: Role.HOD, limit: 100 }),
        apiClient.getUsers({ role: Role.LECTURER, limit: 100 }),
      ])
      const hodR = getItemsFromResponse<HodOption>(hodRes)
      const lecturerR = getItemsFromResponse<HodOption>(lecturerRes)
      const combined = [...(hodR?.items ?? []), ...(lecturerR?.items ?? [])]
      const seen = new Set<string>()
      const deduped = combined.filter((u) => {
        if (seen.has(u.id)) return false
        seen.add(u.id)
        return true
      })
      setOptions(deduped)
    } catch {
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if ((open || (value && options.length === 0)) && !loading) {
      fetchCandidates()
    }
  }, [open, value, options.length, loading, fetchCandidates])

  const q = query.trim().toLowerCase()
  const filtered = q.length >= 1
    ? options.filter((u) => {
        const name = (u.name ?? '').toLowerCase()
        const email = (u.email ?? '').toLowerCase()
        return name.includes(q) || email.includes(q)
      })
    : []

  const selected = options.find((u) => u.id === value)
  const displayValue = open ? query : (selected ? `${selected.name ?? selected.email ?? ''} (${selected.email})` : '')

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

  return (
    <div ref={containerRef} className="relative">
      <Label className="sr-only">Head of Department</Label>
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
              <span className="text-gray-500 italic">No HOD assigned</span>
            </button>
            {loading ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">Loading...</div>
            ) : q.length < 1 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">Type to search (min 1 character)</div>
            ) : filtered.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">No matches</div>
            ) : (
              filtered.map((u) => (
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
