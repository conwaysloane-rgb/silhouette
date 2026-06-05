import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: bookings }, { data: sales }] = await Promise.all([
    supabase
      .from('bookings')
      .select(`
        id, status, total_rental_price, platform_fee, pickup_date, return_date, created_at,
        listing:listings!inner(title, seller_id),
        renter:users!renter_id(full_name)
      `)
      .eq('listings.seller_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('purchases')
      .select(`
        id, sale_price, platform_fee, status, created_at,
        listing:listings!inner(title, seller_id),
        buyer:users!buyer_id(full_name)
      `)
      .eq('listings.seller_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const completed = bookings?.filter(b => b.status === 'completed') ?? []
  const pending   = bookings?.filter(b => b.status === 'pending')   ?? []
  const active    = bookings?.filter(b => ['confirmed','active'].includes(b.status)) ?? []

  const completedSales = sales?.filter(s => s.status === 'completed') ?? []
  const pendingSales   = sales?.filter(s => s.status === 'pending')   ?? []

  const rentalEarned   = completed.reduce((sum, b) => sum + (b.total_rental_price - b.platform_fee), 0)
  const saleEarned     = completedSales.reduce((sum, s) => sum + (s.sale_price - s.platform_fee), 0)
  const totalEarned    = rentalEarned + saleEarned
  const pendingValue   = pending.reduce((sum, b) => sum + b.total_rental_price, 0) + pendingSales.reduce((sum, s) => sum + s.sale_price, 0)
  const activeValue    = active.reduce((sum, b) => sum + (b.total_rental_price - b.platform_fee), 0)

  return (
    <div className="px-4 pt-10 pb-10">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-serif text-4xl tracking-[0.15em] text-neutral-900 uppercase">Earnings</h1>
        <div className="h-px w-8 bg-crimson mt-2" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-8">
        <div className="bg-neutral-900 text-white p-4">
          <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-2">Earned</p>
          <p className="font-serif text-2xl text-white">${totalEarned.toFixed(0)}</p>
          <p className="text-[9px] text-neutral-500 mt-1 uppercase tracking-wide">{completed.length} rental{completed.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="border border-neutral-100 p-4">
          <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-2">Active</p>
          <p className="font-serif text-2xl text-crimson">${activeValue.toFixed(0)}</p>
          <p className="text-[9px] text-neutral-400 mt-1 uppercase tracking-wide">{active.length} out</p>
        </div>
        <div className="border border-neutral-100 p-4">
          <p className="text-[9px] font-medium text-neutral-400 uppercase tracking-widest mb-2">Pending</p>
          <p className="font-serif text-2xl text-neutral-900">${pendingValue.toFixed(0)}</p>
          <p className="text-[9px] text-neutral-400 mt-1 uppercase tracking-wide">{pending.length} request{pending.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Needs your response</p>
          <div className="space-y-2">
            {pending.map(b => {
              const renter = b.renter as unknown as { full_name: string } | null
              const listing = b.listing as unknown as { title: string } | null
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between border border-neutral-200 px-4 py-3 hover:border-neutral-900 transition-colors">
                  <div>
                    <p className="text-xs font-medium text-neutral-900 uppercase tracking-wide">{listing?.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">from {renter?.full_name} · {formatDate(b.pickup_date)} → {formatDate(b.return_date)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-crimson">${b.total_rental_price.toFixed(2)}</span>
                    <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Pending sales */}
      {pendingSales.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Pending handoff (sales)</p>
          <div className="space-y-2">
            {pendingSales.map(s => {
              const buyer = s.buyer as unknown as { full_name: string } | null
              const listing = s.listing as unknown as { title: string } | null
              return (
                <Link key={s.id} href={`/purchases/${s.id}`} className="flex items-center justify-between border border-neutral-200 px-4 py-3 hover:border-neutral-900 transition-colors">
                  <div>
                    <p className="text-xs font-medium text-neutral-900 uppercase tracking-wide">{listing?.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">sold to {buyer?.full_name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-crimson">+${(s.sale_price - s.platform_fee).toFixed(2)}</span>
                    <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Active rentals */}
      {active.length > 0 && (
        <section className="mb-8">
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Active rentals</p>
          <div className="space-y-2">
            {active.map(b => {
              const renter = b.renter as unknown as { full_name: string } | null
              const listing = b.listing as unknown as { title: string } | null
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between border border-crimson/20 px-4 py-3 hover:border-crimson transition-colors">
                  <div>
                    <p className="text-xs font-medium text-neutral-900 uppercase tracking-wide">{listing?.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">rented by {renter?.full_name} · returns {formatDate(b.return_date)}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-sm font-semibold text-crimson">+${(b.total_rental_price - b.platform_fee).toFixed(2)}</span>
                    <svg className="w-3.5 h-3.5 text-neutral-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Completed history */}
      {(completed.length > 0 || completedSales.length > 0) && (
        <section>
          <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Completed</p>
          <div className="space-y-2">
            {completed.map(b => {
              const renter = b.renter as unknown as { full_name: string } | null
              const listing = b.listing as unknown as { title: string } | null
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between border border-neutral-100 px-4 py-3 hover:border-neutral-300 transition-colors">
                  <div>
                    <p className="text-xs font-medium text-neutral-900 uppercase tracking-wide">{listing?.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">rented by {renter?.full_name} · {formatDate(b.pickup_date)} → {formatDate(b.return_date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 flex-shrink-0">+${(b.total_rental_price - b.platform_fee).toFixed(2)}</span>
                </Link>
              )
            })}
            {completedSales.map(s => {
              const buyer = s.buyer as unknown as { full_name: string } | null
              const listing = s.listing as unknown as { title: string } | null
              return (
                <Link key={s.id} href={`/purchases/${s.id}`} className="flex items-center justify-between border border-neutral-100 px-4 py-3 hover:border-neutral-300 transition-colors">
                  <div>
                    <p className="text-xs font-medium text-neutral-900 uppercase tracking-wide">{listing?.title}</p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">sold to {buyer?.full_name}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9px] font-medium uppercase tracking-widest text-neutral-400 border border-neutral-200 px-1.5 py-0.5">Sale</span>
                    <span className="text-sm font-semibold text-neutral-900">+${(s.sale_price - s.platform_fee).toFixed(2)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!bookings?.length && !sales?.length && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-serif italic text-xl text-neutral-400 mb-2">No earnings yet</p>
          <p className="text-[11px] text-neutral-400 uppercase tracking-widest mb-8">List items to start earning</p>
          <Link
            href="/listings/new"
            className="bg-neutral-900 text-white text-[10px] font-medium uppercase tracking-widest px-8 py-3 hover:bg-crimson transition-colors duration-200"
          >
            List an item
          </Link>
        </div>
      )}

      {/* Stripe placeholder */}
      <div className="mt-8 border border-dashed border-neutral-200 p-5 text-center">
        <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-1">Stripe payouts</p>
        <p className="text-xs text-neutral-400 font-serif italic">Connect your account to receive direct payouts — coming soon</p>
      </div>
    </div>
  )
}
