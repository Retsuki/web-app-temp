import { createClient as createBrowserClient } from '@/lib/supabase/client'

/**
 * ブラウザ環境でStorageクライアントを取得
 */
export function getStorageClient() {
  const supabase = createBrowserClient()
  return supabase.storage
}

/**
 * 認証付きStorageクライアントを取得（ブラウザ環境）
 */
export async function getAuthenticatedStorageClient() {
  const supabase = createBrowserClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('認証が必要です')
  }

  return supabase.storage
}
