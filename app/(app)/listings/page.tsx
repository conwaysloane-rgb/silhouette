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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">My Closet</h1>
          <p className="text-sm text-neutral-500">{listings?.length ?? 0} listing{listings?.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/listings/new"
          className="flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          List item
        </Link>
      </div>

      {!listings?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
            </svg>
          </div>
          <p className="font-medium text-neutral-900 mb-1">Nothing listed yet</p>
          <p className="text-sm text-neutral-500 mb-6">Turn your closet into passive income</p>
          <Link
            href="/listings/new"
            className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition"
          >
            List your first item
          </Link>
        </div>
      ) : (
        <div className="space-y-3 pb-6">
          {listings.map(listing => {
            const cover = listing.photos?.sort((a: { display_order: number }, b: { display_order: number }) => a.display_order - b.display_order)[0]?.photo_url
            return (
              <div key={listing.id} className={`flex gap-3 rounded-2xl border p-3 transition ${listing.is_paused ? 'border-neutral-100 bg-neutral-50 opacity-60' : 'border-neutral-100 bg-white'}`}>
                {/* Thumbnail */}
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 flex-shrink-0">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt={listing.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 21h18M6.75 10.5h.008v.008H6.75V10.5z" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-neutral-900 truncate">{listing.title}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">{CATEGORY_LABELS[listing.category]} · {listing.size}</p>
                  <p className="text-sm font-medium text-neutral-900 mt-1">${listing.price_per_day}/day</p>
                  {listing.is_paused && (
                    <span className="inline-block text-[10px] bg-neutral-200 text-neutral-600 rounded-full px-2 py-0.5 mt-1">Paused</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 justify-center">
                  <form action={togglePause.bind(null, listing.id, listing.is_paused)}>
                    <button
                      type="submit"
                      className="w-full text-xs text-neutral-600 border border-neutral-200 rounded-lg px-3 py-1.5 hover:bg-neutral-50 transition whitespace-nowrap"
                    >
                      {listing.is_paused ? 'Unpause' : 'Pause'}
                    </button>
                  </form>
                  <form action={deleteListing.bind(null, listing.id)}>
                    <button
                      type="submit"
                      className="w-full text-xs text-red-500 border border-red-100 rounded-lg px-3 py-1.5 hover:bg-red-50 transition"
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
