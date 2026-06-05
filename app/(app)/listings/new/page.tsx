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
    <div className="px-4 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div>
          <h1 className="font-serif text-2xl tracking-[0.15em] text-neutral-900 uppercase">New Listing</h1>
          <div className="h-px w-6 bg-crimson mt-1" />
        </div>
      </div>

      <form ref={formRef} action={createListing} className="space-y-8">

        {/* Photos */}
        <div>
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
            Photos <span className="text-crimson">*</span>
          </label>
          <PhotoUpload />
        </div>

        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-2">
            Title <span className="text-crimson">*</span>
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={80}
            placeholder="e.g. Black satin midi dress"
            className="w-full border-b border-neutral-300 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-crimson transition-colors bg-transparent"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-2">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            maxLength={400}
            placeholder="Brand, fit, any details renters should know..."
            className="w-full border-b border-neutral-300 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-crimson transition-colors bg-transparent resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
            Category <span className="text-crimson">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CATEGORIES.map(cat => (
              <label key={cat.value} className="relative">
                <input type="radio" name="category" value={cat.value} required className="peer sr-only" />
                <span className="block text-center text-[10px] font-medium uppercase tracking-wide px-2 py-2.5 border border-neutral-200 cursor-pointer transition-colors peer-checked:border-crimson peer-checked:bg-crimson peer-checked:text-white hover:border-neutral-900">
                  {cat.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Size */}
        <div>
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
            Size <span className="text-crimson">*</span>
          </label>
          <div className="flex gap-2">
            {SIZES.map(size => (
              <label key={size} className="flex-1">
                <input type="radio" name="size" value={size} required className="peer sr-only" />
                <span className="block text-center text-[10px] font-medium uppercase tracking-widest py-2.5 border border-neutral-200 cursor-pointer transition-colors peer-checked:border-crimson peer-checked:bg-crimson peer-checked:text-white hover:border-neutral-900">
                  {size}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label htmlFor="price_per_day" className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-2">
              Price / day <span className="text-crimson">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span>
              <input
                id="price_per_day"
                name="price_per_day"
                type="number"
                required
                min={5}
                max={100}
                step={1}
                placeholder="20"
                className="w-full border-b border-neutral-300 pl-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-crimson transition-colors bg-transparent"
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wide">$5 – $100</p>
          </div>

          <div>
            <label htmlFor="deposit_amount" className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-2">
              Deposit <span className="text-crimson">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-sm text-neutral-400">$</span>
              <input
                id="deposit_amount"
                name="deposit_amount"
                type="number"
                required
                min={0}
                step={1}
                placeholder="50"
                className="w-full border-b border-neutral-300 pl-4 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-crimson transition-colors bg-transparent"
              />
            </div>
            <p className="text-[10px] text-neutral-400 mt-1 uppercase tracking-wide">Held at checkout</p>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-neutral-900 py-3.5 text-[11px] font-medium uppercase tracking-widest text-white hover:bg-crimson transition-colors duration-200"
        >
          List Item
        </button>
      </form>
    </div>
  )
}
