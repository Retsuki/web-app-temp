'use server'

import { redirect } from 'next/navigation'
import { getLocale } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import type { SignInData, SignUpData } from './types'

export async function signUp(data: SignUpData) {
  const supabase = await createClient()
  const locale = await getLocale()

  // 1. Supabaseでユーザーを作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'ユーザーの作成に失敗しました' }
  }

  // 2. プロフィールを作成
  const { error: profileError } = await supabase.from('profiles').insert({
    user_id: authData.user.id,
    email: data.email,
    nickname: data.nickname,
  })

  if (profileError) {
    return { error: 'プロフィールの作成に失敗しました' }
  }

  redirect(`/${locale}/dashboard`)
}

export async function signIn(data: SignInData) {
  const supabase = await createClient()
  const locale = await getLocale()

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return { error: error.message }
  }

  redirect(`/${locale}/dashboard`)
}

export async function signInWithGoogle() {
  const supabase = await createClient()
  const locale = await getLocale()

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/${locale}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  const locale = await getLocale()
  await supabase.auth.signOut()
  redirect(`/${locale}/signin`)
}
