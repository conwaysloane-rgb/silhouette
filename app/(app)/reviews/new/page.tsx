'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { submitReview } from '../actions'

interface BookingInfo {
  listingTitle: string
  revieweeName: string
  revieweePhoto: string | null
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHovered(star)}
          onMouseLeave={() => setHovered(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <svg
            className={`w-10 h-10 transition-colors ${
              star <= (hovered || value) ? 'text-neutral-900' : 'text-neutral-200'
            }`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        </button>
      ))}
    </div>
  )
}

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

export default function NewReviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const bookingId = searchParams.get('booking')
  const revieweeId = searchParams.get('reviewee')
  const error = searchParams.get('error')

  const [info, setInfo] = useState<BookingInfo | null>(null)
  const [rating, setRating] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!bookingId || !revieweeId) { router.push('/bookings'); return }
    const supabase = createClient()

    Promise.all([
      supabase
        .from('bookings')
        .select('listing:listings(title)')
        .eq('id', bookingId)
        .single(),
      supabase
        .from('users')
        .select('full_name, profile_photo_url')
        .eq('id', revieweeId)
        .single(),
    ]).then(([bookingRes, userRes]) => {
      const listing = bookingRes.data?.listing as unknown as { title: string } | null
      setInfo({
        listingTitle: listing?.title ?? 'this booking',
        revieweeName: userRes.data?.full_name ?? 'this user',
        revieweePhoto: userRes.data?.profile_photo_url ?? null,
      })
      setLoading(false)
    })
  }, [bookingId, revieweeId, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    )
  }

  if (!info) return null

  return (
    <div className="min-h-screen bg-white px-4 pt-6 pb-10">
      <div className="flex items-center gap-3 mb-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-neutral-900">Leave a review</h1>
      </div>

      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Person being reviewed */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center text-2xl font-bold text-neutral-400 mb-3">
          {info.revieweePhoto
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={info.revieweePhoto} alt="" className="w-full h-full object-cover" />
            : info.revieweeName[0].toUpperCase()
          }
        </div>
        <p className="font-semibold text-neutral-900 text-lg">{info.revieweeName}</p>
        <p className="text-sm text-neutral-500">{info.listingTitle}</p>
      </div>

      <form action={submitReview} className="space-y-6">
        <input type="hidden" name="booking_id" value={bookingId!} />
        <input type="hidden" name="reviewee_id" value={revieweeId!} />
        <input type="hidden" name="rating" value={rating} />

        {/* Star picker */}
        <div className="flex flex-col items-center gap-3">
          <StarPicker value={rating} onChange={setRating} />
          {rating > 0 && (
            <p className="text-sm font-medium text-neutral-600 animate-in fade-in duration-150">
              {STAR_LABELS[rating]}
            </p>
          )}
        </div>

        {/* Written review */}
        <div>
          <label htmlFor="body" className="block text-sm font-semibold text-neutral-900 mb-1">
            Write a review <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="body"
            name="body"
            rows={4}
            maxLength={300}
            placeholder="How was the experience? Would you rent from/to them again?"
            className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={rating === 0}
          className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Submit review
        </button>
      </form>
    </div>
  )
}
