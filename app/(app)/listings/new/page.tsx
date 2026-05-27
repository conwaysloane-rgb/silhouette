'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUpload from '@/components/PhotoUpload'
import { createListing } from '../actions'

const CATEGORIES = [
  { value: 'formal', label: 'Formal' },
  { value: 'themed', label: 'Themed' },
  { value: 'going-out', label: 'Going Out' },
  { value: 'interview', label: 'Interview' },
  { value: 'logo-wear', label: 'Logo Wear' },
]

const SIZES = ['XS', 'S', 'M', 'L', 'XL']

export default function NewListingPage() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-neutral-900">New listing</h1>
      </div>

      <form ref={formRef} action={createListing} className="space-y-6">

        {/* Photos */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Photos <span className="text-red-500">*</span>
          </label>
          <PhotoUpload />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-neutral-900 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={80}
            placeholder="e.g. Black satin midi dress"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-semibold text-neutral-900 mb-1">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={400}
            placeholder="Brand, fit, any details renters should know..."
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <label key={cat.value} className="relative">
                <input type="radio" name="category" value={cat.value} required className="peer sr-only" />
                <span className="block text-center text-xs font-medium px-2 py-2.5 rounded-xl border border-neutral-200 cursor-pointer transition peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white hover:border-neutral-400">
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-sm font-semibold text-neutral-900 mb-2">
            Size <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            {SIZES.map(size => (
              <label key={size} className="flex-1">
                <input type="radio" name="size" value={size} required className="peer sr-only" />
                <span className="block text-center text-sm font-medium py-2.5 rounded-xl border border-neutral-200 cursor-pointer transition peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-checked:text-white hover:border-neutral-400">
                  {size}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="price_per_day" className="block text-sm font-semibold text-neutral-900 mb-1">
              Price / day <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
              <input
                id="price_per_day"
                name="price_per_day"
                type="number"
                required
                min={5}
                max={100}
                step={1}
                placeholder="20"
                className="w-full rounded-xl border border-neutral-200 pl-7 pr-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">$5 – $100</p>
          </div>

          <div>
            <label htmlFor="deposit_amount" className="block text-sm font-semibold text-neutral-900 mb-1">
              Deposit <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-500">$</span>
              <input
                id="deposit_amount"
                name="deposit_amount"
                type="number"
                required
                min={0}
                step={1}
                placeholder="50"
                className="w-full rounded-xl border border-neutral-200 pl-7 pr-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1">Held at checkout</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 active:bg-neutral-700 transition"
        >
          List item
        </button>
      </form>
    </div>
  )
}
