import { redirect } from 'next/navigation'

// Root redirects — middleware handles auth, this is just a safety fallback
export default function RootPage() {
  redirect('/browse')
}
