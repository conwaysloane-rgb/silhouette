'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('full_name') as string

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?next=/auth/setup`,
    },
  })

  if (error) {
    redirect(`/auth/signup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/auth/signup?message=Check your email to confirm your account')
}

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/browse')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/auth/login')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const updates = {
    full_name: formData.get('full_name') as string,
    university: formData.get('university') as string,
    major: formData.get('major') as string,
    grad_year: Number(formData.get('grad_year')) || null,
    bio: formData.get('bio') as string,
  }

  const { error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', user.id)

  if (error) {
    redirect(`/auth/setup?error=${encodeURIComponent(error.message)}`)
  }

  redirect('/browse')
}

export async function acceptTerms() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  await supabase
    .from('users')
    .update({ terms_accepted_at: new Date().toISOString() })
    .eq('id', user.id)
}
