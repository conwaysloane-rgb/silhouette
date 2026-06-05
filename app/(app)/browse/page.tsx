import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import ListingCard from '@/components/ListingCard'
import BrowseFilters from '@/components/BrowseFilters'
import LogoImage from '@/components/LogoImage'

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
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col items-center mb-4">
          <LogoImage />
          <h1 className="font-serif text-4xl tracking-[0.2em] text-neutral-900 uppercase">
            Silhouette
          </h1>
          <div className="h-px w-8 bg-crimson mt-2" />
        </div>
        <Suspense>
          <BrowseFilters />
        </Suspense>
      </div>

      {!listings?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-neutral-300" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0015.803 15.803z" />
            </svg>
          </div>
          <p className="font-serif italic text-lg text-neutral-400 mb-1">Nothing here yet</p>
          <p className="text-xs text-neutral-400 uppercase tracking-widest">
            {params.category || params.size ? 'Try adjusting your filters' : 'Be the first to list something'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest mb-4">
            {listings.length} {listings.length === 1 ? 'item' : 'items'}
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 pb-6">
            {listings.map(listing => (
              <ListingCard key={listing.id} listing={listing as unknown as Parameters<typeof ListingCard>[0]['listing']} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
