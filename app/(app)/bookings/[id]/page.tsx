import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { approveBooking, declineBooking, cancelBooking, markReturned } from '../actions'

const STATUS_CONFIG = {
  pending:   { label: 'Pending approval',    bg: 'bg-yellow-50',   text: 'text-yellow-700',  border: 'border-yellow-100' },
  confirmed: { label: 'Confirmed',           bg: 'bg-blue-50',     text: 'text-blue-700',    border: 'border-blue-100'   },
  active:    { label: 'Active',              bg: 'bg-green-50',    text: 'text-green-700',   border: 'border-green-100'  },
  completed: { label: 'Completed',           bg: 'bg-neutral-50',  text: 'text-neutral-600', border: 'border-neutral-100' },
  cancelled: { label: 'Cancelled',           bg: 'bg-red-50',      text: 'text-red-600',     border: 'border-red-100'    },
} as const

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function BookingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ new?: string; returned?: string }>
}) {
  const { id } = await params
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      *,
      listing:listings(id, title, category, size, price_per_day, seller_id,
        listing_photos(photo_url, display_order),
        seller:users!seller_id(id, full_name, profile_photo_url, university)
      ),
      renter:users!renter_id(id, full_name, profile_photo_url, university)
    `)
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const listing = booking.listing as {
    id: string; title: string; category: string; size: string; price_per_day: number; seller_id: string;
    listing_photos: { photo_url: string; display_order: number }[];
    seller: { id: string; full_name: string; profile_photo_url: string | null; university: string | null }
  }
  const renter = booking.renter as { id: string; full_name: string; profile_photo_url: string | null }

  const isSeller = user.id === listing.seller_id
  const isRenter = user.id === booking.renter_id
  if (!isSeller && !isRenter) notFound()

  const status = booking.status as keyof typeof STATUS_CONFIG
  const cfg = STATUS_CONFIG[status]
  const cover = listing.listing_photos?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url

  const days = Math.ceil(
    (new Date(booking.return_date).getTime() - new Date(booking.pickup_date).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div className="px-4 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/bookings" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <h1 className="text-xl font-bold text-neutral-900">Booking</h1>
      </div>

      {/* Success banners */}
      {sp.new === '1' && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 font-medium">
          Request sent! Waiting for the seller to approve.
        </div>
      )}
      {sp.returned === '1' && (
        <div className="mb-4 rounded-xl bg-green-50 border border-green-100 px-4 py-3 text-sm text-green-700 font-medium">
          Item marked as returned. Deposit has been released.
        </div>
      )}

      {/* Status banner */}
      <div className={`rounded-2xl border px-4 py-3 mb-5 ${cfg.bg} ${cfg.border}`}>
        <p className={`text-sm font-semibold ${cfg.text}`}>{cfg.label}</p>
        {status === 'pending' && isSeller && (
          <p className="text-xs text-neutral-500 mt-0.5">Review and respond to this request</p>
        )}
        {status === 'pending' && isRenter && (
          <p className="text-xs text-neutral-500 mt-0.5">The seller will respond shortly</p>
        )}
        {status === 'confirmed' && (
          <p className="text-xs text-neutral-500 mt-0.5">Coordinate pickup via chat</p>
        )}
        {status === 'completed' && (
          <p className="text-xs text-neutral-500 mt-0.5">This rental is complete</p>
        )}
      </div>

      {/* Listing preview */}
      <Link href={`/browse/${listing.id}`} className="flex gap-3 rounded-2xl border border-neutral-100 p-3 mb-5 hover:border-neutral-300 transition">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
          {cover
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-neutral-100" />
          }
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="font-semibold text-sm text-neutral-900 truncate">{listing.title}</p>
          <p className="text-xs text-neutral-500 mt-0.5">{listing.size} · ${listing.price_per_day}/day</p>
          <p className="text-xs text-neutral-400 mt-0.5">by {listing.seller.full_name}</p>
        </div>
        <svg className="w-4 h-4 text-neutral-300 self-center" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </Link>

      {/* Dates */}
      <div className="rounded-2xl border border-neutral-100 p-4 mb-5">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Rental dates</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-[10px] font-medium text-neutral-400 uppercase mb-1">Pickup</p>
            <p className="text-sm font-semibold text-neutral-900">{formatDate(booking.pickup_date)}</p>
          </div>
          <div className="rounded-xl bg-neutral-50 p-3">
            <p className="text-[10px] font-medium text-neutral-400 uppercase mb-1">Return</p>
            <p className="text-sm font-semibold text-neutral-900">{formatDate(booking.return_date)}</p>
          </div>
        </div>
        <p className="text-xs text-neutral-500 mt-2 text-center">{days} day{days !== 1 ? 's' : ''}</p>
      </div>

      {/* Price breakdown */}
      <div className="rounded-2xl border border-neutral-100 p-4 mb-5 space-y-2">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Pricing</p>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">${listing.price_per_day} × {days} day{days !== 1 ? 's' : ''}</span>
          <span className="font-medium">${booking.total_rental_price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Platform fee (3%)</span>
          <span className="font-medium text-neutral-500">${booking.platform_fee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Security deposit</span>
          <span className="font-medium">${booking.deposit_amount.toFixed(2)}</span>
        </div>
        <div className="border-t border-neutral-100 pt-2 flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span>${(booking.total_rental_price + booking.deposit_amount).toFixed(2)}</span>
        </div>
        {isSeller && (
          <div className="border-t border-neutral-100 pt-2 flex justify-between text-sm">
            <span className="text-neutral-500">Your earnings</span>
            <span className="font-semibold text-green-700">${(booking.total_rental_price - booking.platform_fee).toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Other party */}
      <div className="rounded-2xl border border-neutral-100 p-4 mb-6">
        <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">
          {isSeller ? 'Renter' : 'Seller'}
        </p>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500 font-semibold flex-shrink-0 overflow-hidden">
            {isSeller
              ? (renter.profile_photo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={renter.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  : (renter.full_name?.[0] ?? '?').toUpperCase())
              : (listing.seller.profile_photo_url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img src={listing.seller.profile_photo_url} alt="" className="w-full h-full object-cover" />
                  : (listing.seller.full_name?.[0] ?? '?').toUpperCase())
            }
          </div>
          <div>
            <p className="font-semibold text-sm text-neutral-900">
              {isSeller ? renter.full_name : listing.seller.full_name}
            </p>
            {listing.seller.university && !isSeller && (
              <p className="text-xs text-neutral-500">{listing.seller.university}</p>
            )}
          </div>
        </div>
      </div>

      {/* Chat button — always visible for active bookings */}
      {(status === 'pending' || status === 'confirmed' || status === 'active') && (
        <Link
          href={`/bookings/${booking.id}/chat`}
          className="flex items-center justify-center gap-2 w-full rounded-xl border border-neutral-200 py-3.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-50 transition mb-3"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
          Chat with {isSeller ? 'renter' : 'seller'}
        </Link>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {/* Seller: pending → approve or decline */}
        {isSeller && status === 'pending' && (
          <>
            <form action={approveBooking.bind(null, booking.id)}>
              <button type="submit" className="w-full rounded-xl bg-neutral-900 py-3.5 text-sm font-semibold text-white hover:bg-neutral-800 transition">
                Approve request
              </button>
            </form>
            <form action={declineBooking.bind(null, booking.id)}>
              <button type="submit" className="w-full rounded-xl border border-red-200 py-3.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition">
                Decline request
              </button>
            </form>
          </>
        )}

        {/* Seller: confirmed or active → mark as returned */}
        {isSeller && (status === 'confirmed' || status === 'active') && (
          <form action={markReturned.bind(null, booking.id)}>
            <button type="submit" className="w-full rounded-xl bg-green-600 py-3.5 text-sm font-semibold text-white hover:bg-green-700 transition">
              Mark as returned — release deposit
            </button>
          </form>
        )}

        {/* Renter: pending → cancel */}
        {isRenter && status === 'pending' && (
          <form action={cancelBooking.bind(null, booking.id)}>
            <button type="submit" className="w-full rounded-xl border border-neutral-200 py-3.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition">
              Cancel request
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
