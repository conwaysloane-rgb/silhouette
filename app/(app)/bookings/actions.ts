'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createBooking(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const listingId = formData.get('listing_id') as string
  const pickupDate = formData.get('pickup_date') as string
  const returnDate = formData.get('return_date') as string

  // Availability check
  const { data: available } = await supabase
    .rpc('check_listing_availability', {
      p_listing_id: listingId,
      p_pickup: pickupDate,
      p_return: returnDate,
    })

  if (!available) {
    redirect(`/bookings/new?listing=${listingId}&error=Those dates are already booked`)
  }

  // Fetch listing for pricing
  const { data: listing } = await supabase
    .from('listings')
    .select('price_per_day, deposit_amount, seller_id')
    .eq('id', listingId)
    .single()

  if (!listing) redirect('/browse')
  if (listing.seller_id === user.id) redirect(`/browse/${listingId}`)

  const days = Math.ceil(
    (new Date(returnDate).getTime() - new Date(pickupDate).getTime()) / (1000 * 60 * 60 * 24)
  )
  const rentalTotal = listing.price_per_day * days
  const platformFee = Math.round(rentalTotal * 0.03 * 100) / 100

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      listing_id: listingId,
      renter_id: user.id,
      pickup_date: pickupDate,
      return_date: returnDate,
      total_rental_price: rentalTotal,
      deposit_amount: listing.deposit_amount,
      platform_fee: platformFee,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !booking) {
    redirect(`/bookings/new?listing=${listingId}&error=Failed to create booking`)
  }

  revalidatePath('/bookings')
  redirect(`/bookings/${booking.id}?new=1`)
}

export async function approveBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Verify the current user is the seller
  const { data: booking } = await supabase
    .from('bookings')
    .select('listing_id, listings(seller_id)')
    .eq('id', bookingId)
    .single()

  const seller = (booking?.listings as unknown as { seller_id: string } | null)
  if (!booking || seller?.seller_id !== user.id) return

  await supabase
    .from('bookings')
    .update({ status: 'confirmed' })
    .eq('id', bookingId)

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${bookingId}`)
}

export async function declineBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select('listing_id, listings(seller_id)')
    .eq('id', bookingId)
    .single()

  const seller = (booking?.listings as unknown as { seller_id: string } | null)
  if (!booking || seller?.seller_id !== user.id) return

  await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)

  revalidatePath('/bookings')
}

export async function cancelBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', bookingId)
    .eq('renter_id', user.id)
    .eq('status', 'pending')

  revalidatePath('/bookings')
}

export async function markReturned(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select('listing_id, listings(seller_id)')
    .eq('id', bookingId)
    .single()

  const seller = (booking?.listings as unknown as { seller_id: string } | null)
  if (!booking || seller?.seller_id !== user.id) return

  await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', bookingId)
    .in('status', ['confirmed', 'active'])

  revalidatePath('/bookings')
  revalidatePath(`/bookings/${bookingId}`)
  redirect(`/bookings/${bookingId}?returned=1`)
}
