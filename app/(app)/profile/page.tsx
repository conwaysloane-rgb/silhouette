import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="px-4 pt-12">
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Profile</h1>

      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-2xl text-neutral-400 overflow-hidden flex-shrink-0">
          {profile?.profile_photo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span>{(profile?.full_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()}</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-neutral-900">{profile?.full_name || 'Unnamed'}</p>
          <p className="text-sm text-neutral-500">{user.email}</p>
          {profile?.university && (
            <p className="text-xs text-neutral-400">{profile.university}{profile.grad_year ? ` · Class of ${profile.grad_year}` : ''}</p>
          )}
        </div>
      </div>

      {profile?.bio && (
        <p className="text-sm text-neutral-600 mb-6">{profile.bio}</p>
      )}

      <div className="space-y-2">
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left px-4 py-3 rounded-xl border border-neutral-200 text-sm text-red-600 font-medium hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
