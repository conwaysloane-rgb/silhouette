import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

const CATEGORY_LABELS: Record<string, string> = {
  'formal': 'Formal',
  'themed': 'Themed',
  'going-out': 'Going Out',
  'interview': 'Interview',
  'logo-wear': 'Logo Wear',
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      photos:listing_photos(photo_url, display_order),
      seller:users!seller_id(id, full_name, profile_photo_url, university, grad_year, bio)
    `)
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (!listing) notFound()

  const photos = listing.photos?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order) ?? []
  const isOwnListing = listing.seller_id === user.id

  // Average rating for seller
  const { data: reviews } = await supabase
    .from('reviews')
    .select('rating')
    .eq('reviewee_id', listing.seller_id)

  const avgRating = reviews?.length
    ? (reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  return (
    <div className="pb-32">
      {/* Back button */}
      <div className="absolute top-4 left-4 z-10">
        <Link
          href="/browse"
          className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-sm flex items-center justify-center hover:bg-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </Link>
      </div>

      {/* Photo carousel */}
      <div className="relative w-full overflow-hidden">
        {photos.length > 0 ? (
          <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            {photos.map((photo: { photo_url: string; display_order: number }, i: number) => (
              <div key={i} className="w-full flex-shrink-0 snap-center aspect-[4/5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.photo_url} alt={listing.title} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="aspect-[4/5] bg-neutral-100 flex items-center justify-center text-neutral-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5h.008v.008H6.75V10.5z" />
            </svg>
          </div>
        )}

        {/* Photo count dots */}
        {photos.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
            {photos.map((_: unknown, i: number) => (
              <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pt-5 space-y-5">
        {/* Title + badges */}
        <div>
          <div className="flex gap-2 mb-2">
            <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full">
              {CATEGORY_LABELS[listing.category]}
            </span>
            <span className="text-xs font-medium bg-neutral-100 text-neutral-600 px-2.5 py-1 rounded-full">
              Size {listing.size}
            </span>
            {listing.is_paused && (
              <span className="text-xs font-medium bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full">
                Paused
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-neutral-900">{listing.title}</h1>
          {listing.description && (
            <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{listing.description}</p>
          )}
        </div>

        {/* Pricing */}
        <div className="flex gap-3">
          {['rental', 'both'].includes(listing.listing_type ?? 'rental') && (
            <div className="flex-1 rounded-2xl bg-neutral-50 border border-neutral-100 px-4 py-3 text-center">
              <p className="text-lg font-bold text-neutral-900">${listing.price_per_day}</p>
              <p className="text-xs text-neutral-500">per day</p>
            </div>
          )}
          {['rental', 'both'].includes(listing.listing_type ?? 'rental') && (
            <div className="flex-1 rounded-2xl bg-neutral-50 border border-neutral-100 px-4 py-3 text-center">
              <p className="text-lg font-bold text-neutral-900">${listing.deposit_amount}</p>
              <p className="text-xs text-neutral-500">deposit hold</p>
            </div>
          )}
          {['sale', 'both'].includes(listing.listing_type ?? 'rental') && listing.sale_price && (
            <div className="flex-1 rounded-2xl bg-neutral-50 border border-crimson/20 px-4 py-3 text-center">
              <p className="text-lg font-bold text-crimson">${listing.sale_price}</p>
              <p className="text-xs text-neutral-500">buy outright</p>
            </div>
          )}
        </div>

        {/* Seller card */}
        {listing.seller && (
          <Link href={`/profile/${listing.seller.id}`} className="block border border-neutral-100 p-4 hover:border-neutral-300 transition-colors">
            <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-3">Listed by</p>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-neutral-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-neutral-400 font-semibold">
                {listing.seller.profile_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.seller.profile_photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (listing.seller.full_name?.[0] ?? '?').toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-900 uppercase tracking-wide">{listing.seller.full_name}</p>
                {listing.seller.university && (
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    {listing.seller.university}
                    {listing.seller.grad_year ? ` · ${listing.seller.grad_year}` : ''}
                  </p>
                )}
                {avgRating && (
                  <p className="text-[11px] text-neutral-400 mt-0.5">★ {avgRating} ({reviews?.length} review{reviews?.length !== 1 ? 's' : ''})</p>
                )}
              </div>
              <svg className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
            {listing.seller.bio && (
              <p className="text-sm text-neutral-500 mt-3 font-serif italic">{listing.seller.bio}</p>
            )}
          </Link>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-100 px-4 py-4 max-w-lg mx-auto">
        {isOwnListing ? (
          <div className="bg-neutral-100 py-3.5 text-center text-sm font-medium text-neutral-500">
            This is your listing
          </div>
        ) : listing.is_paused ? (
          <div className="bg-neutral-100 py-3.5 text-center text-sm font-medium text-neutral-500">
            Not available right now
          </div>
        ) : (
          <div className="flex gap-3">
            {['rental', 'both'].includes(listing.listing_type ?? 'rental') && listing.price_per_day && (
              <Link
                href={`/bookings/new?listing=${listing.id}`}
                className="flex-1 bg-neutral-900 py-3.5 text-center text-[11px] font-medium uppercase tracking-widest text-white hover:bg-neutral-700 transition-colors"
              >
                Rent — ${listing.price_per_day}/day
              </Link>
            )}
            {['sale', 'both'].includes(listing.listing_type ?? 'rental') && listing.sale_price && (
              <Link
                href={`/purchases/new?listing=${listing.id}`}
                className="flex-1 bg-crimson py-3.5 text-center text-[11px] font-medium uppercase tracking-widest text-white hover:bg-neutral-900 transition-colors"
              >
                Buy — ${listing.sale_price}
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
