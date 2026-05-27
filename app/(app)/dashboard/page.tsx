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

  // All bookings on my listings
  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id, status, total_rental_price, platform_fee, pickup_date, return_date, created_at,
      listing:listings!inner(title, seller_id),
      renter:users!renter_id(full_name)
    `)
    .eq('listings.seller_id', user.id)
    .order('created_at', { ascending: false })

  const completed = bookings?.filter(b => b.status === 'completed') ?? []
  const pending   = bookings?.filter(b => b.status === 'pending')   ?? []
  const active    = bookings?.filter(b => ['confirmed','active'].includes(b.status)) ?? []

  const totalEarned = completed.reduce((sum, b) => sum + (b.total_rental_price - b.platform_fee), 0)
  const pendingValue = pending.reduce((sum, b) => sum + b.total_rental_price, 0)
  const activeValue  = active.reduce((sum, b)  => sum + (b.total_rental_price - b.platform_fee), 0)

  return (
    <div className="px-4 pt-10 pb-10">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Earnings</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-2xl bg-neutral-900 text-white p-4">
          <p className="text-xs font-medium text-neutral-400 mb-1">Total earned</p>
          <p className="text-xl font-bold">${totalEarned.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-500 mt-1">{completed.length} rental{completed.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
          <p className="text-xs font-medium text-neutral-500 mb-1">In progress</p>
          <p className="text-xl font-bold text-neutral-900">${activeValue.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-400 mt-1">{active.length} active</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-4">
          <p className="text-xs font-medium text-neutral-500 mb-1">Pending</p>
          <p className="text-xl font-bold text-neutral-900">${pendingValue.toFixed(2)}</p>
          <p className="text-[10px] text-neutral-400 mt-1">{pending.length} request{pending.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Pending requests — action needed */}
      {pending.length > 0 && (
        <section className="mb-8">
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Needs your response</p>
          <div className="space-y-2">
            {pending.map(b => {
              const renter = b.renter as unknown as { full_name: string } | null
              const listing = b.listing as unknown as { title: string } | null
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between rounded-2xl border border-yellow-100 bg-yellow-50 px-4 py-3 hover:border-yellow-300 transition">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{listing?.title}</p>
                    <p className="text-xs text-neutral-500">from {renter?.full_name} · {formatDate(b.pickup_date)} → {formatDate(b.return_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">${b.total_rental_price.toFixed(2)}</span>
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Active rentals</p>
          <div className="space-y-2">
            {active.map(b => {
              const renter = b.renter as unknown as { full_name: string } | null
              const listing = b.listing as unknown as { title: string } | null
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between rounded-2xl border border-green-100 bg-green-50 px-4 py-3 hover:border-green-300 transition">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{listing?.title}</p>
                    <p className="text-xs text-neutral-500">rented by {renter?.full_name} · returns {formatDate(b.return_date)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-green-700">+${(b.total_rental_price - b.platform_fee).toFixed(2)}</span>
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
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
      {completed.length > 0 && (
        <section>
          <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mb-3">Completed</p>
          <div className="space-y-2">
            {completed.map(b => {
              const renter = b.renter as unknown as { full_name: string } | null
              const listing = b.listing as unknown as { title: string } | null
              return (
                <Link key={b.id} href={`/bookings/${b.id}`} className="flex items-center justify-between rounded-2xl border border-neutral-100 px-4 py-3 hover:border-neutral-300 transition">
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{listing?.title}</p>
                    <p className="text-xs text-neutral-500">rented by {renter?.full_name} · {formatDate(b.pickup_date)} → {formatDate(b.return_date)}</p>
                  </div>
                  <span className="text-sm font-semibold text-neutral-900">+${(b.total_rental_price - b.platform_fee).toFixed(2)}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Empty state */}
      {!bookings?.length && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="font-medium text-neutral-900 mb-1">No earnings yet</p>
          <p className="text-sm text-neutral-500 mb-6">List items to start earning</p>
          <Link href="/listings/new" className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition">
            List an item
          </Link>
        </div>
      )}

      {/* Stripe connect placeholder */}
      <div className="mt-8 rounded-2xl border border-dashed border-neutral-200 p-5 text-center">
        <p className="text-sm font-medium text-neutral-600 mb-1">Stripe payouts</p>
        <p className="text-xs text-neutral-400">Connect your Stripe account to receive direct payouts — coming soon</p>
      </div>
    </div>
  )
}
