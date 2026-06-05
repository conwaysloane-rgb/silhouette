import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const STATUS_CONFIG = {
  pending:   { label: 'Pending',   style: 'border-neutral-300 text-neutral-500' },
  confirmed: { label: 'Confirmed', style: 'border-neutral-900 text-neutral-900' },
  active:    { label: 'Active',    style: 'border-crimson text-crimson'         },
  completed: { label: 'Completed', style: 'border-neutral-200 text-neutral-400' },
  cancelled: { label: 'Cancelled', style: 'border-neutral-100 text-neutral-300' },
} as const

function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  return (
    <span className={`text-[9px] font-medium uppercase tracking-widest px-2 py-0.5 border ${cfg.style}`}>
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

  const [
    { data: renting },
    { data: selling },
    { data: bought },
  ] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id, pickup_date, return_date, total_rental_price, deposit_amount, status, created_at,
        listing:listings(id, title, listing_photos(photo_url, display_order), users!seller_id(full_name))
      `)
      .eq('renter_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('bookings')
      .select(`
        id, pickup_date, return_date, total_rental_price, deposit_amount, status, created_at,
        listing:listings(id, title, listing_photos(photo_url, display_order)),
        renter:users!renter_id(full_name)
      `)
      .eq('listings.seller_id', user.id)
      .not('listing', 'is', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('purchases')
      .select(`
        id, sale_price, platform_fee, status, created_at,
        listing:listings(id, title, listing_photos(photo_url, display_order))
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const hasAny = (renting?.length ?? 0) + (selling?.length ?? 0) + (bought?.length ?? 0) > 0

  return (
    <div className="px-4 pt-10 pb-6">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-serif text-4xl tracking-[0.15em] text-neutral-900 uppercase">Bookings</h1>
        <div className="h-px w-8 bg-crimson mt-2" />
      </div>

      {!hasAny && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-serif italic text-xl text-neutral-400 mb-2">No bookings yet</p>
          <p className="text-[11px] text-neutral-400 uppercase tracking-widest mb-8">Browse listings to make your first request</p>
          <Link
            href="/browse"
            className="bg-neutral-900 text-white text-[10px] font-medium uppercase tracking-widest px-8 py-3 hover:bg-crimson transition-colors duration-200"
          >
            Browse listings
          </Link>
        </div>
      )}

      {/* Renting section */}
      {(renting?.length ?? 0) > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Renting</p>
          <div className="space-y-2">
            {renting!.map(b => {
              const listing = b.listing as unknown as { id: string; title: string; listing_photos: { photo_url: string; display_order: number }[] } | null
              const cover = listing?.listing_photos?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex gap-3 border border-neutral-100 p-3 hover:border-neutral-300 transition-colors">
                  <div className="w-14 h-14 overflow-hidden bg-neutral-100 flex-shrink-0">
                    {cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={cover} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-neutral-100" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-neutral-900 truncate uppercase tracking-wide">{listing?.title}</p>
                      <StatusBadge status={b.status as keyof typeof STATUS_CONFIG} />
                    </div>
                    <p className="text-[11px] text-neutral-400">{formatDate(b.pickup_date)} → {formatDate(b.return_date)}</p>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs font-semibold text-crimson">${b.total_rental_price.toFixed(2)}</p>
                      {['pending','confirmed','active'].includes(b.status) && (
                        <Link href={`/bookings/${b.id}/chat`} onClick={e => e.stopPropagation()} className="text-[10px] uppercase tracking-widest text-neutral-400 hover:text-neutral-900 transition-colors flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>
                          Chat
                        </Link>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Selling section */}
      {(selling?.length ?? 0) > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Requests on my listings</p>
          <div className="space-y-2">
            {selling!.map(b => {
              const listing = b.listing as unknown as { id: string; title: string; listing_photos: { photo_url: string; display_order: number }[] } | null
              const renter = b.renter as unknown as { full_name: string } | null
              const cover = listing?.listing_photos?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex gap-3 border border-neutral-100 p-3 hover:border-neutral-300 transition-colors">
                  <div className="w-14 h-14 overflow-hidden bg-neutral-100 flex-shrink-0">
                    {cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={cover} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-neutral-100" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-neutral-900 truncate uppercase tracking-wide">{listing?.title}</p>
                      <StatusBadge status={b.status as keyof typeof STATUS_CONFIG} />
                    </div>
                    <p className="text-[11px] text-neutral-400">from {renter?.full_name}</p>
                    <p className="text-[11px] text-neutral-400">{formatDate(b.pickup_date)} → {formatDate(b.return_date)}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Purchases section */}
      {(bought?.length ?? 0) > 0 && (
        <section>
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Purchases</p>
          <div className="space-y-2">
            {bought!.map(p => {
              const listing = p.listing as unknown as { id: string; title: string; listing_photos: { photo_url: string; display_order: number }[] } | null
              const cover = listing?.listing_photos?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url
              const purchaseStatus = p.status as 'pending' | 'completed' | 'cancelled'
              const purchaseStatusConfig = {
                pending:   { label: 'Pending handoff', style: 'border-neutral-300 text-neutral-500' },
                completed: { label: 'Completed',       style: 'border-neutral-200 text-neutral-400' },
                cancelled: { label: 'Cancelled',       style: 'border-neutral-100 text-neutral-300' },
              }
              const pCfg = purchaseStatusConfig[purchaseStatus] ?? purchaseStatusConfig.pending
              return (
                <Link key={p.id} href={`/purchases/${p.id}`} className="flex gap-3 border border-neutral-100 p-3 hover:border-neutral-300 transition-colors">
                  <div className="w-14 h-14 overflow-hidden bg-neutral-100 flex-shrink-0">
                    {cover
                      // eslint-disable-next-line @next/next/no-img-element
                      ? <img src={cover} alt="" className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-neutral-100" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-neutral-900 truncate uppercase tracking-wide">{listing?.title}</p>
                      <span className={`text-[9px] font-medium uppercase tracking-widest px-2 py-0.5 border ${pCfg.style} flex-shrink-0`}>
                        {pCfg.label}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-crimson mt-1">${(p.sale_price + p.platform_fee).toFixed(2)}</p>
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
