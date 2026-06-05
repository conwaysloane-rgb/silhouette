'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPurchase(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const listingId = formData.get('listing_id') as string

  const { data: listing } = await supabase
    .from('listings')
    .select('sale_price, seller_id, is_deleted, listing_type')
    .eq('id', listingId)
    .single()

  if (!listing || listing.is_deleted) redirect('/browse')
  if (listing.seller_id === user.id) redirect(`/browse/${listingId}`)
  if (!listing.sale_price || !['sale', 'both'].includes(listing.listing_type)) redirect(`/browse/${listingId}`)

  const platformFee = Math.round(listing.sale_price * 0.03 * 100) / 100

  const { data: purchase, error } = await supabase
    .from('purchases')
    .insert({
      listing_id: listingId,
      buyer_id: user.id,
      sale_price: listing.sale_price,
      platform_fee: platformFee,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !purchase) redirect(`/browse/${listingId}?error=Failed to place order`)

  revalidatePath('/purchases')
  revalidatePath('/bookings')
  redirect(`/purchases/${purchase.id}?new=1`)
}

export async function completePurchase(purchaseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify seller
  const { data: purchase } = await supabase
    .from('purchases')
    .select('listing_id, listings(seller_id)')
    .eq('id', purchaseId)
    .single()

  const seller = purchase?.listings as unknown as { seller_id: string } | null
  if (!purchase || seller?.seller_id !== user.id) return

  await supabase
    .from('purchases')
    .update({ status: 'completed' })
    .eq('id', purchaseId)
    .eq('status', 'pending')

  revalidatePath(`/purchases/${purchaseId}`)
  revalidatePath('/dashboard')
  redirect(`/purchases/${purchaseId}?completed=1`)
}

export async function cancelPurchase(purchaseId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Allow buyer to cancel pending
  await supabase
    .from('purchases')
    .update({ status: 'cancelled' })
    .eq('id', purchaseId)
    .eq('buyer_id', user.id)
    .eq('status', 'pending')

  revalidatePath(`/purchases/${purchaseId}`)
  revalidatePath('/bookings')
}
