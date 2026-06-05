import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createPurchase } from '../actions'
import Link from 'next/link'

export default async function NewPurchasePage({
  searchParams,
}: {
  searchParams: Promise<{ listing?: string; error?: string }>
}) {
  const { listing: listingId, error } = await searchParams
  if (!listingId) redirect('/browse')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      id, title, description, category, size, sale_price, listing_type,
      photos:listing_photos(photo_url, display_order),
      seller:users!seller_id(id, full_name, profile_photo_url)
    `)
    .eq('id', listingId)
    .eq('is_deleted', false)
    .single()

  if (!listing || !listing.sale_price || !['sale', 'both'].includes(listing.listing_type)) notFound()

  const seller = listing.seller as unknown as { id: string; full_name: string; profile_photo_url: string | null }
  if (seller.id === user.id) redirect(`/browse/${listingId}`)

  const cover = (listing.photos as { photo_url: string; display_order: number }[])
    ?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url

  const platformFee = Math.round(listing.sale_price * 0.03 * 100) / 100

  return (
    <div className="px-4 pt-6 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/browse/${listingId}`}
          className="text-neutral-400 hover:text-neutral-900 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
        <div>
          <h1 className="font-serif text-2xl tracking-[0.15em] text-neutral-900 uppercase">Confirm Purchase</h1>
          <div className="h-px w-6 bg-crimson mt-1" />
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 border border-crimson/30 bg-crimson/5 text-sm text-crimson">
          {error}
        </div>
      )}

      {/* Item preview */}
      <div className="flex gap-3 border border-neutral-100 p-3 mb-6">
        <div className="w-20 h-20 overflow-hidden bg-neutral-100 flex-shrink-0">
          {cover
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
            : <div className="w-full h-full bg-neutral-100" />
          }
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <p className="text-xs font-medium text-neutral-900 uppercase tracking-wide truncate">{listing.title}</p>
          <p className="text-[11px] text-neutral-400 mt-0.5">{listing.size}</p>
          <p className="text-[11px] text-neutral-400">by {seller.full_name}</p>
        </div>
      </div>

      {/* Price breakdown */}
      <div className="border border-neutral-100 p-4 mb-8 space-y-2">
        <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Order Summary</p>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Item price</span>
          <span className="font-medium">${listing.sale_price.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-neutral-600">Platform fee (3%)</span>
          <span className="font-medium text-neutral-400">${platformFee.toFixed(2)}</span>
        </div>
        <div className="border-t border-neutral-100 pt-2 flex justify-between text-sm font-semibold">
          <span>Total</span>
          <span className="text-crimson">${(listing.sale_price + platformFee).toFixed(2)}</span>
        </div>
      </div>

      <p className="text-[11px] text-neutral-400 text-center mb-6 uppercase tracking-wide">
        The seller will arrange handoff after you place your order
      </p>

      <form action={createPurchase}>
        <input type="hidden" name="listing_id" value={listingId} />
        <button
          type="submit"
          className="w-full bg-neutral-900 text-white py-3.5 text-[11px] font-medium uppercase tracking-widest hover:bg-crimson transition-colors duration-200"
        >
          Place Order — ${(listing.sale_price + platformFee).toFixed(2)}
        </button>
      </form>
    </div>
  )
}
