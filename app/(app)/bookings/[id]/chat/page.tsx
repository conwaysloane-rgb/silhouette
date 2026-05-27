import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatThread from './ChatThread'

export default async function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, status,
      listing:listings(id, title, seller_id,
        seller:users!seller_id(id, full_name, profile_photo_url)
      ),
      renter:users!renter_id(id, full_name, profile_photo_url)
    `)
    .eq('id', id)
    .single()

  if (!booking) notFound()

  const listing = booking.listing as unknown as {
    id: string; title: string; seller_id: string;
    seller: { id: string; full_name: string; profile_photo_url: string | null }
  }
  const renter = booking.renter as unknown as {
    id: string; full_name: string; profile_photo_url: string | null
  }

  const isSeller = user.id === listing.seller_id
  const isRenter = user.id === renter.id
  if (!isSeller && !isRenter) notFound()

  const otherUser = isSeller ? renter : listing.seller

  // Load initial messages server-side
  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id, sender:users!sender_id(id, full_name, profile_photo_url)')
    .eq('booking_id', id)
    .order('created_at', { ascending: true })

  return (
    <ChatThread
      bookingId={id}
      currentUserId={user.id}
      listingTitle={listing.title}
      otherUser={otherUser}
      initialMessages={(messages ?? []) as unknown as Parameters<typeof ChatThread>[0]['initialMessages']}
    />
  )
}
