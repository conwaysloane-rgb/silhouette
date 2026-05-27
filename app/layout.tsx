import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Silhouette — Campus Clothing Rental',
  description: 'From her closet to yours. Peer-to-peer campus clothing rental.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  )
}
