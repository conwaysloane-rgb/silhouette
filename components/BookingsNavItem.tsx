import { createClient } from '@/lib/supabase/server'

export default async function BookingsNavDot() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // Check for pending booking requests on my listings
  const { count } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('listings.seller_id', user.id)
    .not('listing', 'is', null)

  if (!count) return null

  return (
    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  )
}
