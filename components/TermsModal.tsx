'use client'

import { useState } from 'react'
import { acceptTerms } from '@/app/auth/actions'

export default function TermsModal() {
  const [loading, setLoading] = useState(false)

  async function handleAccept() {
    setLoading(true)
    await acceptTerms()
    // Reload to clear the modal (server will see terms_accepted_at is now set)
    window.location.reload()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-neutral-900 mb-1">Community Terms</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Before you browse, please read and accept our terms.
        </p>

        <div className="rounded-xl bg-neutral-50 border border-neutral-100 p-4 text-sm text-neutral-700 space-y-3 max-h-60 overflow-y-auto mb-5">
          <p><strong>Silhouette Community Terms of Service</strong></p>
          <p>By using Silhouette, you agree to the following:</p>
          <ul className="space-y-2 list-disc list-inside">
            <li>You will return all rented items in the same condition as received, by the agreed return date.</li>
            <li>You will not misrepresent the condition or description of any item you list.</li>
            <li>A security deposit will be held at checkout and released upon confirmed return.</li>
            <li>Silhouette collects a 3% platform fee on all rental transactions.</li>
            <li>Disputes are handled via our support team. We reserve the right to ban users who violate these terms.</li>
            <li>You are responsible for coordinating pickup and return directly with the other party via in-app chat.</li>
            <li>Silhouette is a marketplace facilitator only and is not responsible for item quality or damage.</li>
          </ul>
        </div>

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full rounded-xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-60 transition"
        >
          {loading ? 'Accepting...' : 'I agree — continue'}
        </button>
      </div>
    </div>
  )
}
