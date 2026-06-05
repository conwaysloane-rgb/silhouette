'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function followUser(followingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase.from('follows').insert({
    follower_id: user.id,
    following_id: followingId,
  })

  revalidatePath(`/profile/${followingId}`)
  revalidatePath('/profile')
}

export async function unfollowUser(followingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase
    .from('follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', followingId)

  revalidatePath(`/profile/${followingId}`)
  revalidatePath('/profile')
}
