'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { SignInData, SignUpData } from '../types'
import { authActionError, createUserProfileAndProject, deleteUserOnError } from './auth-helpers'

export async function signUp(data: SignUpData) {
  const supabase = await createClient()

  // 1. Supabaseでユーザーを作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  })

  if (authError) {
    return authActionError(authError.message)
  }

  if (!authData.user) {
    return authActionError('ユーザーの作成に失敗しました')
  }

  // 2. プロフィールとプロジェクトを作成
  const language = data.lang || 'ja'
  const setupResult = await createUserProfileAndProject(authData.user, data.nickname, language)

  // エラーの場合はユーザーを削除
  if (!setupResult.success && setupResult.error) {
    await deleteUserOnError(authData.user.id)
  }

  // 3. クライアント側でセッション反映＋リダイレクトを実施
  return {
    success: true,
    profileId: setupResult.profileId,
    projectId: setupResult.projectId,
  }
}

export async function signIn(data: SignInData) {
  const supabase = await createClient()

  // 1. 認証
  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  })

  if (error) {
    return authActionError(error.message)
  }

  if (!authData.session) {
    return authActionError('セッションの作成に失敗しました')
  }
  // クライアント側でセッション反映とリダイレクトを実行（omに合わせる）
  return { success: true }
}

export async function signInWithGoogle(lang = 'ja') {
  const supabase = await createClient()

  // headers()を使用して現在のホストを取得
  const { headers } = await import('next/headers')
  const headersList = await headers()
  const host = headersList.get('host') || ''
  const protocol = headersList.get('x-forwarded-proto') || 'http'

  // 環境変数が設定されている場合はそちらを優先、なければ動的に生成
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${siteUrl}/${lang}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  })

  if (error) {
    return authActionError(error.message)
  }

  if (data.url) {
    redirect(data.url)
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/signin')
}
