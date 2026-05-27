import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/auth/actions'
import Link from 'next/link'

function StarDisplay({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'lg' }) {
  const w = size === 'lg' ? 'w-5 h-5' : 'w-3.5 h-3.5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <svg key={s} className={`${w} ${s <= Math.round(rating) ? 'text-neutral-900' : 'text-neutral-200'}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  )
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const [{ data: profile }, { data: reviews }, { data: listingCount }] = await Promise.all([
    supabase.from('users').select('*').eq('id', user.id).single(),
    supabase
      .from('reviews')
      .select(`
        id, rating, body, created_at,
        reviewer:users!reviewer_id(full_name, profile_photo_url)
      `)
      .eq('reviewee_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('is_deleted', false),
  ])

  const avgRating = reviews?.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : null

  return (
    <div className="px-4 pt-10 pb-10">
      {/* Profile header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center text-2xl font-bold text-neutral-400 overflow-hidden flex-shrink-0">
          {profile?.profile_photo_url
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={profile.profile_photo_url} alt="" className="w-full h-full object-cover" />
            : (profile?.full_name?.[0] ?? user.email?.[0] ?? '?').toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-neutral-900">{profile?.full_name || 'Your Profile'}</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
          {profile?.university && (
            <p className="text-xs text-neutral-400 mt-0.5">
              {profile.university}{profile.grad_year ? ` · Class of ${profile.grad_year}` : ''}
            </p>
          )}
          {profile?.major && (
            <p className="text-xs text-neutral-400">{profile.major}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      {profile?.bio && (
        <p className="text-sm text-neutral-600 mb-6 leading-relaxed">{profile.bio}</p>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3 text-center">
          <p className="text-lg font-bold text-neutral-900">{(listingCount as unknown as { count: number } | null)?.count ?? 0}</p>
          <p className="text-xs text-neutral-500">Listings</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3 text-center">
          <p className="text-lg font-bold text-neutral-900">{reviews?.length ?? 0}</p>
          <p className="text-xs text-neutral-500">Reviews</p>
        </div>
        <div className="rounded-2xl bg-neutral-50 border border-neutral-100 p-3 text-center">
          {avgRating ? (
            <>
              <p className="text-lg font-bold text-neutral-900">{avgRating.toFixed(1)}</p>
              <div className="flex justify-center mt-0.5">
                <StarDisplay rating={avgRating} />
              </div>
            </>
          ) : (
            <>
              <p className="text-lg font-bold text-neutral-300">—</p>
              <p className="text-xs text-neutral-400">Rating</p>
            </>
          )}
        </div>
      </div>

      {/* Reviews section */}
      {(reviews?.length ?? 0) > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-base font-bold text-neutral-900">Reviews</h2>
            {avgRating && (
              <div className="flex items-center gap-1.5">
                <StarDisplay rating={avgRating} />
                <span className="text-sm text-neutral-500">{avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>
          <div className="space-y-4">
            {reviews!.map(review => {
              const reviewer = review.reviewer as unknown as { full_name: string; profile_photo_url: string | null } | null
              return (
                <div key={review.id} className="rounded-2xl border border-neutral-100 p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 overflow-hidden flex items-center justify-center text-xs font-semibold text-neutral-500 flex-shrink-0">
                      {reviewer?.profile_photo_url
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={reviewer.profile_photo_url} alt="" className="w-full h-full object-cover" />
                        : (reviewer?.full_name?.[0] ?? '?').toUpperCase()
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-neutral-900">{reviewer?.full_name ?? 'Anonymous'}</p>
                      <p className="text-xs text-neutral-400">{formatDate(review.created_at)}</p>
                    </div>
                    <StarDisplay rating={review.rating} />
                  </div>
                  {review.body && (
                    <p className="text-sm text-neutral-600 leading-relaxed">{review.body}</p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* No reviews yet */}
      {!reviews?.length && (
        <div className="rounded-2xl border border-dashed border-neutral-200 p-6 text-center mb-8">
          <p className="text-sm text-neutral-500">No reviews yet</p>
          <p className="text-xs text-neutral-400 mt-1">Complete your first rental to get reviewed</p>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2">
        <Link
          href="/auth/setup"
          className="flex items-center justify-between w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition"
        >
          Edit profile
          <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </Link>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full text-left px-4 py-3 rounded-xl border border-neutral-200 text-sm font-medium text-red-600 hover:bg-red-50 transition"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  )
}
