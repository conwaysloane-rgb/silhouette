'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const photoUrls = formData.getAll('photos') as string[]

  const listingType = (formData.get('listing_type') as string) || 'rental'
  const pricePerDayRaw = formData.get('price_per_day') as string
  const depositRaw = formData.get('deposit_amount') as string
  const salePriceRaw = formData.get('sale_price') as string
  const retailPriceRaw = formData.get('retail_price') as string

  const { data: listing, error } = await supabase
    .from('listings')
    .insert({
      seller_id: user.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      size: formData.get('size') as string,
      listing_type: listingType,
      price_per_day: pricePerDayRaw ? parseFloat(pricePerDayRaw) : null,
      deposit_amount: depositRaw ? parseFloat(depositRaw) : null,
      sale_price: salePriceRaw ? parseFloat(salePriceRaw) : null,
      retail_price: retailPriceRaw ? parseFloat(retailPriceRaw) : null,
    })
    .select()
    .single()

  if (error || !listing) {
    redirect(`/listings/new?error=${encodeURIComponent(error?.message ?? 'Failed to create listing')}`)
  }

  if (photoUrls.length > 0) {
    await supabase.from('listing_photos').insert(
      photoUrls.map((url, i) => ({
        listing_id: listing.id,
        photo_url: url,
        display_order: i,
      }))
    )
  }

  revalidatePath('/listings')
  revalidatePath('/browse')
  redirect('/listings')
}

export async function togglePause(listingId: string, currentlyPaused: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase
    .from('listings')
    .update({ is_paused: !currentlyPaused })
    .eq('id', listingId)
    .eq('seller_id', user.id)

  revalidatePath('/listings')
}

export async function deleteListing(listingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase
    .from('listings')
    .update({ is_deleted: true })
    .eq('id', listingId)
    .eq('seller_id', user.id)

  revalidatePath('/listings')
  revalidatePath('/browse')
}
