'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function submitReview(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const bookingId = formData.get('booking_id') as string
  const revieweeId = formData.get('reviewee_id') as string
  const rating = parseInt(formData.get('rating') as string, 10)
  const body = (formData.get('body') as string).trim()

  if (!bookingId || !revieweeId || !rating || rating < 1 || rating > 5) {
    redirect(`/reviews/new?booking=${bookingId}&reviewee=${revieweeId}&error=Invalid review`)
  }

  // Verify booking is completed and user is a participant
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, renter_id, listing:listings(seller_id)')
    .eq('id', bookingId)
    .eq('status', 'completed')
    .single()

  if (!booking) redirect(`/bookings/${bookingId}?error=Booking not found`)

  const listing = booking.listing as unknown as { seller_id: string }
  const isRenter = user.id === booking.renter_id
  const isSeller = user.id === listing.seller_id
  if (!isRenter && !isSeller) redirect('/bookings')

  // Check not already reviewed
  const { data: existing } = await supabase
    .from('reviews')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('reviewer_id', user.id)
    .maybeSingle()

  if (existing) redirect(`/bookings/${bookingId}?error=Already reviewed`)

  await supabase.from('reviews').insert({
    booking_id: bookingId,
    reviewer_id: user.id,
    reviewee_id: revieweeId,
    rating,
    body: body || null,
  })

  revalidatePath(`/bookings/${bookingId}`)
  revalidatePath(`/profile/${revieweeId}`)
  redirect(`/bookings/${bookingId}?reviewed=1`)
}
