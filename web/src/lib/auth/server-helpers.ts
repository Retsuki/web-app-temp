import { redirect } from 'next/navigation'
// import createClient from 'openapi-fetch'
// import type { paths } from '@/lib/api/schema'
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

  // Temporarily commented out due to missing imports
  /*
  // 認証ヘッダー付きのAPIクライアントを作成
  return createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
  })
  */

  // Temporary mock return
  return null as unknown
}

/**
 * 認証必須ページのラッパー（Server Component用）
 * ユーザー情報とプロフィールを取得して返す
 */
export async function requireAuth() {
  const user = await getAuthenticatedUser()
  // Temporarily commented out due to missing imports
  /*
  const apiClient = await getAuthenticatedApiClient()

  const { data: profileResponse, error } = await apiClient.GET('/api/v1/users/me')

  if (error) {
    console.error('プロフィール取得エラー:', error)
    return { user, profile: null, error }
  }

  return {
    user,
    profile: profileResponse.data,
    error: null,
  }
  */

  // Temporary mock return
  return {
    user,
    profile: null,
    error: null,
  }
}
