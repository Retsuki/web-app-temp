import { redirect } from 'next/navigation'
import { createClient as createSupabase } from '@/lib/supabase/server'

/**
 * 認証済みユーザーを取得（Server Component用）
 * 未認証の場合はサインインページへリダイレクト
 */
export async function getAuthenticatedUser() {
  const supabase = await createSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  return user
}

/**
 * 認証付きAPIクライアントを作成（Server Component用）
 */
export async function getAuthenticatedApiClient() {
  const supabase = await createSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('認証トークンが見つかりません')
  }

  return session.access_token
}

/**
 * 認証必須ページのラッパー（Server Component用）
 * ユーザー情報とプロフィールを取得して返す
 */
export async function requireAuth() {
  const supabase = await createSupabase()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/signin')
  }

  // Supabaseから直接プロフィールを取得
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    console.error('プロフィール取得エラー:', error)
    return { user, profile: null, error }
  }

  return {
    user,
    profile,
    error: null,
  }
}
