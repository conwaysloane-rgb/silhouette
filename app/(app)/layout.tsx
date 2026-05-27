import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BottomNav from '@/components/BottomNav'
import TermsModal from '@/components/TermsModal'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('terms_accepted_at')
    .eq('id', user.id)
    .single()

  const needsTerms = !profile?.terms_accepted_at

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {needsTerms && <TermsModal />}
      <main className="flex-1 pb-20 max-w-lg mx-auto w-full">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
