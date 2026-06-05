import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { completePurchase, cancelPurchase } from '../actions'

export default async function PurchaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ new?: string; completed?: string }>
}) {
  const { id } = await params
  const { new: isNew, completed: justCompleted } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: purchase } = await supabase
    .from('purchases')
    .select(`
      id, sale_price, platform_fee, status, created_at,
      listing:listings(
        id, title, size, category,
        photos:listing_photos(photo_url, display_order),
        seller:users!seller_id(id, full_name, profile_photo_url)
      ),
      buyer:users!buyer_id(id, full_name)
    `)
    .eq('id', id)
    .single()

  if (!purchase) notFound()

  const listing = purchase.listing as unknown as {
    id: string
    title: string
    size: string
    category: string
    photos: { photo_url: string; display_order: number }[]
    seller: { id: string; full_name: string; profile_photo_url: string | null }
  } | null

  const buyer = purchase.buyer as unknown as { id: string; full_name: string } | null

  // Only buyer or seller can view
  const isBuyer = buyer?.id === user.id
  const isSeller = listing?.seller.id === user.id
  if (!isBuyer && !isSeller) redirect('/browse')

  const cover = listing?.photos
    ?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url

  const STATUS_CONFIG = {
    pending:   { label: 'Pending handoff',  style: 'border-neutral-300 text-neutral-500' },
    completed: { label: 'Completed',        style: 'border-neutral-200 text-neutral-400' },
    cancelled: { label: 'Cancelled',        style: 'border-neutral-100 text-neutral-300' },
  } as const

  const statusCfg = STATUS_CONFIG[purchase.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending

  return (
    <div className="px-4 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/bookings"
          className="text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="font-serif text-2xl tracking-[0.15em] text-neutral-900 uppercase">Purchase</h1>
          <div className="h-px w-6 bg-crimson mt-1" />
        </div>
      </div>

      {/* Flash messages */}
      {isNew && (
        <div className="mb-6 px-4 py-3 border border-neutral-900 bg-neutral-900 text-sm text-white text-center uppercase tracking-widest text-[10px] font-medium">
          Order placed — the seller will arrange handoff
        </div>
      )}
      {justCompleted && (
        <div className="mb-6 px-4 py-3 border border-neutral-200 bg-neutral-50 text-sm text-neutral-700 text-center uppercase tracking-widest text-[10px] font-medium">
          Marked as completed
        </div>
      )}

      {/* Status badge */}
      <div className="flex items-center justify-between mb-6">
        <span className={`text-[9px] font-medium uppercase tracking-widest px-2 py-0.5 border ${statusCfg.style}`}>
          {statusCfg.label}
        </span>
        <p className="text-[11px] text-neutral-400">
          {new Date(purchase.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Item preview */}
      <div className="flex gap-3 border border-neutral-100 p-3 mb-6">
        <div className="w-20 h-20 overflow-hidden bg-neutral-100 flex-shrink-0">
          {cover
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={cover} alt={listing?.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-neutral-100" />
          }
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-xs font-medium text-neutral-900 uppercase tracking-wide truncate">{listing?.title}</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">Size {listing?.size}</p>
          {isBuyer && (
            <p className="text-[11px] text-neutral-400">from {listing?.seller.full_name}</p>
          )}
          {isSeller && (
            <p className="text-[11px] text-neutral-400">to {buyer?.full_name}</p>
          )}
        </div>
      </div>

      {/* Order summary */}
      <div className="border border-neutral-100 p-4 mb-8 space-y-2">
        <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Order Summary</p>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Item price</span>
          <span className="font-medium">${purchase.sale_price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Platform fee (3%)</span>
          <span className="font-medium text-neutral-400">${purchase.platform_fee.toFixed(2)}</span>
        </div>
        <div className="border-t border-neutral-100 pt-2 flex justify-between text-sm font-semibold">
          <span>{isBuyer ? 'Total paid' : 'You receive'}</span>
          <span className="text-crimson">
            {isBuyer
              ? `$${(purchase.sale_price + purchase.platform_fee).toFixed(2)}`
              : `$${(purchase.sale_price - purchase.platform_fee).toFixed(2)}`
            }
          </span>
        </div>
      </div>

      {/* Actions */}
      {purchase.status === 'pending' && (
        <div className="space-y-3">
          {isSeller && (
            <form action={completePurchase.bind(null, purchase.id)}>
              <button
                type="submit"
                className="w-full bg-neutral-900 text-white py-3.5 text-[11px] font-medium uppercase tracking-widest hover:bg-crimson transition-colors duration-200"
              >
                Mark as Handed Off
              </button>
            </form>
          )}
          {isBuyer && (
            <form action={cancelPurchase.bind(null, purchase.id)}>
              <button
                type="submit"
                className="w-full border border-neutral-300 text-neutral-500 py-3 text-[11px] font-medium uppercase tracking-widest hover:border-neutral-900 hover:text-neutral-900 transition-colors"
              >
                Cancel Order
              </button>
            </form>
          )}
        </div>
      )}

      {purchase.status === 'completed' && isBuyer && listing && (
        <Link
          href={`/browse/${listing.id}`}
          className="block text-center text-[11px] text-neutral-400 uppercase tracking-widest hover:text-neutral-900 transition-colors"
        >
          View listing
        </Link>
      )}
    </div>
  )
}
