import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { submitSupportTicket } from './actions'

const REASONS = [
  { value: 'item-not-described', label: 'Item not as described' },
  { value: 'item-damaged',       label: 'Item damaged or missing' },
  { value: 'no-show',            label: 'Seller / Buyer no-show' },
  { value: 'inappropriate',      label: 'Inappropriate behavior' },
  { value: 'payment',            label: 'Payment or refund issue' },
  { value: 'fraud',              label: 'Listing fraud or scam' },
  { value: 'other',              label: 'Other' },
]

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { error, success } = await searchParams

  if (success) {
    return (
      <div className="px-4 pt-6 pb-10">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/profile" className="text-neutral-400 hover:text-neutral-900 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </Link>
          <div>
            <h1 className="font-serif text-2xl tracking-[0.15em] text-neutral-900 uppercase">Support</h1>
            <div className="h-px w-6 bg-crimson mt-1" />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 border border-neutral-900 flex items-center justify-center mb-5">
            <svg className="w-5 h-5 text-neutral-900" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl tracking-[0.1em] text-neutral-900 uppercase mb-3">Received</h2>
          <p className="text-sm text-neutral-500 font-serif italic max-w-xs leading-relaxed">
            Your report has been sent. We&apos;ll look into it and follow up if needed.
          </p>
          <Link
            href="/browse"
            className="mt-8 bg-neutral-900 text-white text-[10px] font-medium uppercase tracking-widest px-8 py-3 hover:bg-crimson transition-colors duration-200"
          >
            Back to Browse
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link href="/profile" className="text-neutral-400 hover:text-neutral-900 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="font-serif text-2xl tracking-[0.15em] text-neutral-900 uppercase">Support</h1>
          <div className="h-px w-6 bg-crimson mt-1" />
        </div>
      </div>

      <p className="text-[11px] text-neutral-400 uppercase tracking-widest mb-8">
        Report an issue and we&apos;ll get back to you
      </p>

      {error && (
        <div className="mb-6 px-4 py-3 border border-crimson/30 bg-crimson/5 text-sm text-crimson">
          {error}
        </div>
      )}

      <form action={submitSupportTicket} className="space-y-8">

        {/* Reason */}
        <div>
          <label className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-3">
            What is this about? <span className="text-crimson">*</span>
          </label>
          <div className="space-y-2">
            {REASONS.map(r => (
              <label key={r.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="reason"
                  value={r.value}
                  required
                  className="peer sr-only"
                />
                <span className="w-4 h-4 border border-neutral-300 flex-shrink-0 flex items-center justify-center transition-colors peer-checked:border-crimson peer-checked:bg-crimson group-hover:border-neutral-900">
                  <span className="w-1.5 h-1.5 bg-white opacity-0 peer-checked:opacity-100" />
                </span>
                <span className="text-sm text-neutral-700 peer-checked:text-crimson group-hover:text-neutral-900 transition-colors">
                  {r.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Order reference */}
        <div>
          <label htmlFor="order_ref" className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-2">
            Booking or Order ID <span className="text-neutral-300">(optional)</span>
          </label>
          <input
            id="order_ref"
            name="order_ref"
            type="text"
            placeholder="Paste the booking or purchase ID if relevant"
            className="w-full border-b border-neutral-300 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-crimson transition-colors bg-transparent"
          />
        </div>

        {/* Message */}
        <div>
          <label htmlFor="message" className="block text-[10px] font-medium text-neutral-500 uppercase tracking-widest mb-2">
            Describe the issue <span className="text-crimson">*</span>
          </label>
          <textarea
            id="message"
            name="message"
            required
            rows={5}
            maxLength={1000}
            placeholder="Please describe what happened in as much detail as possible..."
            className="w-full border-b border-neutral-300 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-crimson transition-colors bg-transparent resize-none"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-crimson text-white py-3.5 text-[11px] font-medium uppercase tracking-widest hover:bg-neutral-900 transition-colors duration-200"
        >
          Submit Report
        </button>
      </form>
    </div>
  )
}
