'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const CATEGORIES = [
  { value: '', label: 'All' },
  { value: 'formal', label: 'Formal' },
  { value: 'themed', label: 'Themed' },
  { value: 'going-out', label: 'Going Out' },
  { value: 'interview', label: 'Interview' },
  { value: 'logo-wear', label: 'Logo Wear' },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL']

export default function BrowseFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeCategory = searchParams.get('category') ?? ''
  const activeSize = searchParams.get('size') ?? ''

  const setParam = useCallback((key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/browse?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  return (
    <div className="space-y-3">
      {/* Category row */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setParam('category', activeCategory === cat.value ? '' : cat.value)}
            className={`flex-shrink-0 text-xs font-medium px-3.5 py-1.5 rounded-full border transition ${
              activeCategory === cat.value
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Size row */}
      <div className="flex gap-2">
        {SIZES.map(size => (
          <button
            key={size}
            onClick={() => setParam('size', activeSize === size ? '' : size)}
            className={`flex-1 text-xs font-medium py-1.5 rounded-xl border transition ${
              activeSize === size
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'border-neutral-200 text-neutral-600 hover:border-neutral-400'
            }`}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  )
}
