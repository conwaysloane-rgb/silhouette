import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ChatThread from './ChatThread'

export default async function PurchaseChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: purchase } = await supabase
    .from('purchases')
    .select(`
      id, status,
      listing:listings(id, title, seller_id,
        seller:users!seller_id(id, full_name, profile_photo_url)
      ),
      buyer:users!buyer_id(id, full_name, profile_photo_url)
    `)
    .eq('id', id)
    .single()

  if (!purchase) notFound()

  const listing = purchase.listing as unknown as {
    id: string; title: string; seller_id: string;
    seller: { id: string; full_name: string; profile_photo_url: string | null }
  }
  const buyer = purchase.buyer as unknown as {
    id: string; full_name: string; profile_photo_url: string | null
  }

  const isSeller = user.id === listing.seller_id
  const isBuyer = user.id === buyer.id
  if (!isSeller && !isBuyer) notFound()

  const otherUser = isSeller ? buyer : listing.seller

  const { data: messages } = await supabase
    .from('messages')
    .select('id, content, created_at, sender_id, sender:users!sender_id(id, full_name, profile_photo_url)')
    .eq('purchase_id', id)
    .order('created_at', { ascending: true })

  return (
    <ChatThread
      purchaseId={id}
      currentUserId={user.id}
      listingTitle={listing.title}
      otherUser={otherUser}
      initialMessages={(messages ?? []) as unknown as Parameters<typeof ChatThread>[0]['initialMessages']}
    />
  )
}
