import Link from 'next/link'

interface Props {
  listing: {
    id: string
    title: string
    category: string
    size: string
    price_per_day: number | null
    sale_price?: number | null
    listing_type?: string | null
    photos?: { photo_url: string; display_order: number }[]
    seller?: { full_name: string; profile_photo_url: string | null } | null
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  'formal': 'Formal',
  'themed': 'Themed',
  'going-out': 'Going Out',
  'interview': 'Interview',
  'logo-wear': 'Logo Wear',
}

export default function ListingCard({ listing }: Props) {
  const cover = listing.photos
    ?.sort((a, b) => a.display_order - b.display_order)[0]?.photo_url

  return (
    <Link href={`/browse/${listing.id}`} className="group block">
      {/* Photo */}
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-100 mb-2.5">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={listing.title}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-200">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5h.008v.008H6.75V10.5z" />
            </svg>
          </div>
        )}

        {/* Sale badge */}
        {['sale', 'both'].includes(listing.listing_type ?? 'rental') && (
          <div className="absolute top-2 left-2">
            <span className="text-[8px] font-medium uppercase tracking-widest bg-crimson text-white px-1.5 py-0.5">
              For Sale
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-xs font-medium text-neutral-900 truncate leading-tight tracking-wide uppercase">
        {listing.title}
      </p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[11px] text-neutral-400">{CATEGORY_LABELS[listing.category]} · {listing.size}</span>
        <div className="flex items-center gap-1.5">
          {listing.sale_price && ['sale', 'both'].includes(listing.listing_type ?? 'rental') && (
            <span className="text-xs font-semibold text-crimson">${listing.sale_price}</span>
          )}
          {listing.price_per_day && ['rental', 'both'].includes(listing.listing_type ?? 'rental') && (
            <span className="text-xs font-semibold text-neutral-500">${listing.price_per_day}/day</span>
          )}
        </div>
      </div>
      {listing.seller && (
        <p className="text-[10px] text-neutral-400 mt-0.5 truncate">{listing.seller.full_name}</p>
      )}
    </Link>
  )
}
