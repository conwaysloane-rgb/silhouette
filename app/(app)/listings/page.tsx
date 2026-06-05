import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { togglePause, deleteListing } from './actions'

const CATEGORY_LABELS: Record<string, string> = {
  'formal': 'Formal',
  'themed': 'Themed',
  'going-out': 'Going Out',
  'interview': 'Interview',
  'logo-wear': 'Logo Wear',
}

export default async function MyListingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: listings } = await supabase
    .from('listings')
    .select('*, photos:listing_photos(photo_url, display_order)')
    .eq('seller_id', user.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })

  return (
    <div className="px-4 pt-10">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-end justify-between mb-1">
          <h1 className="font-serif text-4xl tracking-[0.15em] text-neutral-900 uppercase">My Closet</h1>
          <Link
            href="/listings/new"
            className="flex items-center gap-1.5 bg-neutral-900 text-white text-[10px] font-medium uppercase tracking-widest px-4 py-2.5 hover:bg-crimson transition-colors duration-200"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            List item
          </Link>
        </div>
        <div className="h-px w-8 bg-crimson mb-1" />
        <p className="text-[10px] text-neutral-400 uppercase tracking-widest">
          {listings?.length ?? 0} listing{listings?.length !== 1 ? 's' : ''}
        </p>
      </div>

      {!listings?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="font-serif italic text-xl text-neutral-400 mb-2">Your closet is empty</p>
          <p className="text-[11px] text-neutral-400 uppercase tracking-widest mb-8">Turn your closet into passive income</p>
          <Link
            href="/listings/new"
            className="bg-neutral-900 text-white text-[10px] font-medium uppercase tracking-widest px-8 py-3 hover:bg-crimson transition-colors duration-200"
          >
            List your first item
          </Link>
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {listings.map(listing => {
            const cover = listing.photos?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)[0]?.photo_url
            return (
              <div key={listing.id} className={`flex gap-3 border p-3 transition ${listing.is_paused ? 'border-neutral-100 bg-neutral-50/50 opacity-50' : 'border-neutral-150 bg-white'}`}>
                {/* Thumbnail */}
                <div className="w-20 h-20 overflow-hidden bg-neutral-100 flex-shrink-0">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-200">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5h.008v.008H6.75V10.5z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 py-0.5">
                  <p className="text-xs font-medium text-neutral-900 truncate uppercase tracking-wide">{listing.title}</p>
                  <p className="text-[11px] text-neutral-400 mt-0.5">{CATEGORY_LABELS[listing.category]} · {listing.size}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {listing.price_per_day && ['rental', 'both'].includes(listing.listing_type ?? 'rental') && (
                      <p className="text-sm font-semibold text-neutral-600">${listing.price_per_day}/day</p>
                    )}
                    {listing.sale_price && ['sale', 'both'].includes(listing.listing_type ?? 'rental') && (
                      <p className="text-sm font-semibold text-crimson">${listing.sale_price} buy</p>
                    )}
                  </div>
                  {listing.is_paused && (
                    <span className="inline-block text-[9px] uppercase tracking-widest border border-neutral-300 text-neutral-400 px-2 py-0.5 mt-1">Paused</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 justify-center">
                  <form action={togglePause.bind(null, listing.id, listing.is_paused)}>
                    <button
                      type="submit"
                      className="w-full text-[10px] uppercase tracking-widest text-neutral-600 border border-neutral-200 px-3 py-1.5 hover:border-neutral-900 hover:text-neutral-900 transition-colors whitespace-nowrap"
                    >
                      {listing.is_paused ? 'Unpause' : 'Pause'}
                    </button>
                  </form>
                  <form action={deleteListing.bind(null, listing.id)}>
                    <button
                      type="submit"
                      className="w-full text-[10px] uppercase tracking-widest text-crimson border border-crimson/20 px-3 py-1.5 hover:bg-crimson hover:text-white transition-colors"
                    >
                      Delete
                    </button>
                  </form>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
