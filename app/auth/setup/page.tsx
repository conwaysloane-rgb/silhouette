import { updateProfile } from '../actions'
import WelcomeModal from '@/components/WelcomeModal'

const GRAD_YEARS = [2025, 2026, 2027, 2028, 2029]

export default async function ProfileSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <WelcomeModal />
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-neutral-900">Set up your profile</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Help the community get to know you
          </p>
        </div>

        {params.error && (
          <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {params.error}
          </div>
        )}

        <form action={updateProfile} className="space-y-4">
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-neutral-700 mb-1">
              Full name
            </label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              required
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
              placeholder="Jane Smith"
            />
          </div>

          <div>
            <label htmlFor="university" className="block text-sm font-medium text-neutral-700 mb-1">
              University
            </label>
            <input
              id="university"
              name="university"
              type="text"
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
              placeholder="University of Michigan"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="major" className="block text-sm font-medium text-neutral-700 mb-1">
                Major
              </label>
              <input
                id="major"
                name="major"
                type="text"
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition"
                placeholder="Business"
              />
            </div>
            <div>
              <label htmlFor="grad_year" className="block text-sm font-medium text-neutral-700 mb-1">
                Class of
              </label>
              <select
                id="grad_year"
                name="grad_year"
                className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition bg-white"
              >
                <option value="">—</option>
                {GRAD_YEARS.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-neutral-700 mb-1">
              Bio <span className="text-neutral-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="bio"
              name="bio"
              rows={3}
              maxLength={200}
              className="w-full rounded-xl border border-neutral-200 px-4 py-3 text-sm outline-none focus:border-neutral-900 focus:ring-2 focus:ring-neutral-900/10 transition resize-none"
              placeholder="A little about your style..."
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 transition"
          >
            Finish setup
          </button>
        </form>
      </div>
    </div>
  )
}
