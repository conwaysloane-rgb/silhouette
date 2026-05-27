'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createBooking } from '../actions'
import Link from 'next/link'

interface ListingInfo {
  id: string
  title: string
  price_per_day: number
  deposit_amount: number
  photos: { photo_url: string; display_order: number }[]
  seller: { full_name: string } | null
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function NewBookingPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const listingId = searchParams.get('listing')
  const error = searchParams.get('error')

  const [listing, setListing] = useState<ListingInfo | null>(null)
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!listingId) { router.push('/browse'); return }
    const supabase = createClient()
    supabase
      .from('listings')
      .select('id, title, price_per_day, deposit_amount, photos:listing_photos(photo_url, display_order), seller:users!seller_id(full_name)')
      .eq('id', listingId)
      .single()
      .then(({ data }) => {
        if (!data) { router.push('/browse'); return }
        setListing(data as unknown as ListingInfo)
        setLoading(false)
      })
  }, [listingId, router])

  const days = pickupDate && returnDate
    ? Math.ceil((new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0
  const rentalTotal = days > 0 && listing ? days * listing.price_per_day : 0
  const platformFee = Math.round(rentalTotal * 0.03 * 100) / 100
  const depositAmount = listing?.deposit_amount ?? 0
  const totalDue = rentalTotal + depositAmount
  const isValid = days > 0 && pickupDate >= today

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!listing) return null

  const cover = listing.photos?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url

  return (
    <div className="px-4 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Request to book</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Listing preview */}
      <div className="flex gap-3 rounded-2xl border border-neutral-100 p-3 mb-6">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
          {cover
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-neutral-100" />
          }
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="font-semibold text-sm text-neutral-900 truncate">{listing.title}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{listing.seller?.full_name}</p>
          <p className="text-sm font-medium text-neutral-900 mt-1">${listing.price_per_day}/day</p>
        </div>
      </div>

      {/* Date picker */}
      <form action={createBooking} className="space-y-5">
        <input type="hidden" name="listing_id" value={listing.id} />
        <input type="hidden" name="pickup_date" value={pickupDate} />
        <input type="hidden" name="return_date" value={returnDate} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1">Pickup date</label>
            <input
              type="date"
              min={today}
              value={pickupDate}
              onChange={e => {
                setPickupDate(e.target.value)
                if (returnDate && returnDate <= e.target.value) setReturnDate('')
              }}
              className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-neutral-900 mb-1">Return date</label>
            <input
              type="date"
              min={pickupDate || today}
              value={returnDate}
              onChange={e => setReturnDate(e.target.value)}
              disabled={!pickupDate}
              className="w-full rounded-xl border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition disabled:opacity-40"
            />
          </div>
        </div>

        {/* Price breakdown */}
        {isValid && (
          <div className="rounded-2xl border border-neutral-100 p-4 space-y-3">
            <p className="text-sm font-semibold text-neutral-900">Price breakdown</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-neutral-600">${listing.price_per_day} × {days} day{days !== 1 ? 's' : ''}</span>
                <span className="font-medium">${rentalTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Platform fee (3%)</span>
                <span className="font-medium text-neutral-500">${platformFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Security deposit <span className="text-neutral-400">(held, returned)</span></span>
                <span className="font-medium">${depositAmount.toFixed(2)}</span>
              </div>
              <div className="border-t border-neutral-100 pt-2 flex justify-between font-semibold">
                <span>Total due at pickup</span>
                <span>${totalDue.toFixed(2)}</span>
              </div>
            </div>
            <div className="flex items-start gap-2 bg-neutral-50 rounded-xl p-3 mt-1">
              <svg className="w-4 h-4 text-neutral-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Coordinate pickup directly with {listing.seller?.full_name ?? 'the seller'} via in-app chat. Deposit is released after they confirm the item is returned.
              </p>
            </div>
          </div>
        )}

        {/* Dates display */}
        {isValid && (
          <div className="text-center text-sm text-neutral-500">
            {formatDate(pickupDate)} → {formatDate(returnDate)} · {days} day{days !== 1 ? 's' : ''}
          </div>
        )}

        <button
          type="submit"
          disabled={!isValid}
          className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isValid ? `Send request — $${totalDue.toFixed(2)} due at pickup` : 'Select dates to continue'}
        </button>
      </form>
    </div>
  )
}
