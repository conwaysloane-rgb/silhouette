import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'
import BrowseFilters from '@/components/BrowseFilters'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; size?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select(`
      id, title, category, size, price_per_day,
      photos:listing_photos(photo_url, display_order),
      seller:users!seller_id(full_name, profile_photo_url)
    `)
    .eq('is_deleted', false)
    .eq('is_paused', false)
    .order('created_at', { ascending: false })

  if (params.category) query = query.eq('category', params.category)
  if (params.size) query = query.eq('size', params.size)

  const { data: listings } = await query

  return (
    <div className="px-4 pt-10">
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">Browse</h1>
        <Suspense>
          <BrowseFilters />
        </Suspense>
      </div>

      {!listings?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
          </div>
          <p className="font-medium text-neutral-900 mb-1">No listings yet</p>
          <p className="text-sm text-neutral-500">
            {params.category || params.size ? 'Try adjusting your filters' : 'Be the first to list something'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-neutral-400 mb-4">{listings.length} item{listings.length !== 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 pb-6">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing as unknown as Parameters<typeof ListingCard>[0]['listing']} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
