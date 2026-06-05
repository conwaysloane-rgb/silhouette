'use client'

import { useState } from 'react'

export default function WelcomeModal() {
  const [open, setOpen] = useState(true)

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
      />

      {/* Modal */}
      <div className="relative bg-crimson w-full max-w-sm px-8 py-10 flex flex-col items-center text-center">
        {/* Decorative rule */}
        <div className="h-px w-10 bg-white/50 mb-6" />

        <h2 className="font-serif text-3xl tracking-[0.15em] text-white uppercase mb-5">
          Welcome to Silhouette!
        </h2>

        <div className="space-y-4 font-serif text-white/90 text-[15px] leading-relaxed italic">
          <p>
            Sometimes you simply don&apos;t have the time and money for shipping,
            waiting, and the steep fees that come with a new outfit for a special
            occasion.
          </p>
          <p>
            And what better way to make passive income than to capitalize on the
            cash already in your closet.
          </p>
          <p>
            This is a peer-to-peer college shopping and rental marketplace,
            created by Duke students Sloane Conway and Adeline Furst.
          </p>
          <p className="not-italic font-medium text-white">
            We are so happy to have you.
          </p>
        </div>

        {/* Decorative rule */}
        <div className="h-px w-10 bg-white/50 mt-6 mb-7" />

        <button
          onClick={() => setOpen(false)}
          className="bg-white text-crimson text-[11px] font-medium uppercase tracking-widest px-10 py-3 hover:bg-neutral-100 transition-colors duration-200"
        >
          Let&apos;s Go
        </button>
      </div>
    </div>
  )
}
