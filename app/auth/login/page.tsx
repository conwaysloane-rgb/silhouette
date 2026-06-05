import Link from 'next/link'
import { signIn } from '../actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Wordmark */}
      <div className="flex flex-col items-center pt-20 pb-10 px-8">
        <h1 className="font-serif text-5xl tracking-[0.25em] text-neutral-900 uppercase">
          Silhouette
        </h1>
        <div className="h-px w-12 bg-crimson mt-4 mb-3" />
        <p className="font-serif italic text-neutral-400 text-sm tracking-wide">
          From her closet to yours
        </p>
      </div>

      {/* Form */}
      <div className="flex-1 flex flex-col items-center px-8">
        <div className="w-full max-w-sm">

          {params.error && (
            <div className="mb-6 px-4 py-3 border border-crimson/30 bg-crimson/5 text-sm text-crimson rounded-lg">
              {params.error}
            </div>
          )}
          {params.message && (
            <div className="mb-6 px-4 py-3 border border-neutral-200 bg-neutral-50 text-sm text-neutral-700 rounded-lg">
              {params.message}
            </div>
          )}

          <form action={signIn} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full border-b border-neutral-300 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-crimson transition-colors bg-transparent"
                placeholder="you@university.edu"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-neutral-500 uppercase tracking-widest mb-2">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full border-b border-neutral-300 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-300 outline-none focus:border-crimson transition-colors bg-transparent"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-neutral-900 text-white py-3.5 text-xs font-medium uppercase tracking-widest hover:bg-crimson transition-colors duration-200"
              >
                Sign In
              </button>
            </div>
          </form>

          <p className="mt-8 text-center text-xs text-neutral-400 tracking-wide">
            New to Silhouette?{' '}
            <Link href="/auth/signup" className="text-neutral-900 underline underline-offset-4 hover:text-crimson transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
