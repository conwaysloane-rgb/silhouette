'use client'

import { useState } from 'react'

export default function LogoImage() {
  const [hidden, setHidden] = useState(false)
  if (hidden) return null
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/logo.png"
      alt="Silhouette"
      className="h-28 w-auto object-contain mb-1"
      onError={() => setHidden(true)}
    />
  )
}
