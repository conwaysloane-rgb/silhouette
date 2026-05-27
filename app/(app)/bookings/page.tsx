import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   bg: 'bg-yellow-50',  text: 'text-yellow-700' },
  confirmed: { label: 'Confirmed', bg: 'bg-blue-50',    text: 'text-blue-700'   },
  active:    { label: 'Active',    bg: 'bg-green-50',   text: 'text-green-700'  },
  completed: { label: 'Completed', bg: 'bg-neutral-100', text: 'text-neutral-600' },
  cancelled: { label: 'Cancelled', bg: 'bg-red-50',     text: 'text-red-600'    },
} as const

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${cfg.bg} ${cfg.text}`}>
      {cfg.label}
    </span>
  )
}

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function BookingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Bookings where I'm the renter
  const { data: renting } = await supabase
    .from('bookings')
    .select(`
      id, pickup_date, return_date, total_rental_price, deposit_amount, status, created_at,
      listing:listings(id, title, listing_photos(photo_url, display_order), users!seller_id(full_name))
    `)
    .eq('renter_id', user.id)
    .order('created_at', { ascending: false })

  // Bookings on my listings (I'm the seller)
  const { data: selling } = await supabase
    .from('bookings')
    .select(`
      id, pickup_date, return_date, total_rental_price, deposit_amount, status, created_at,
      listing:listings(id, title, listing_photos(photo_url, display_order)),
      renter:users!renter_id(full_name)
    `)
    .eq('listings.seller_id', user.id)
    .not('listing', 'is', null)
    .order('created_at', { ascending: false })

  const hasAny = (renting?.length ?? 0) + (selling?.length ?? 0) > 0

  return (
    <div className="px-4 pt-10 pb-6">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Bookings</h1>

      {!hasAny && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
            </svg>
          </div>
          <p className="font-medium text-neutral-900 mb-1">No bookings yet</p>
          <p className="text-sm text-neutral-500 mb-6">Browse listings to make your first request</p>
          <Link href="/browse" className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition">
            Browse listings
          </Link>
        </div>
      )}

      {/* Renting section */}
      {(renting?.length ?? 0) > 0 && (
        <section className="mb-8">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Renting</p>
          <div className="space-y-3">
            {renting!.map(b => {
              const listing = b.listing as unknown as { id: string; title: string; listing_photos: { photo_url: string; display_order: number }[] } | null
              const cover = listing?.listing_photos?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex gap-3 rounded-2xl border border-neutral-100 p-3 hover:border-neutral-300 transition">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    {cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={cover} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-neutral-100" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{listing?.title}</p>
                      <StatusBadge status={b.status as keyof typeof STATUS_CONFIG} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{formatDate(b.pickup_date)} → {formatDate(b.return_date)}</p>
                    <p className="text-xs font-medium text-neutral-700 mt-1">${b.total_rental_price.toFixed(2)} rental</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Selling section */}
      {(selling?.length ?? 0) > 0 && (
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Requests on my listings</p>
          <div className="space-y-3">
            {selling!.map(b => {
              const listing = b.listing as unknown as { id: string; title: string; listing_photos: { photo_url: string; display_order: number }[] } | null
              const renter = b.renter as unknown as { full_name: string } | null
              const cover = listing?.listing_photos?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex gap-3 rounded-2xl border border-neutral-100 p-3 hover:border-neutral-300 transition">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                    {cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={cover} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-neutral-100" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold text-neutral-900 truncate">{listing?.title}</p>
                      <StatusBadge status={b.status as keyof typeof STATUS_CONFIG} />
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">from {renter?.full_name}</p>
                    <p className="text-xs text-neutral-500">{formatDate(b.pickup_date)} → {formatDate(b.return_date)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
