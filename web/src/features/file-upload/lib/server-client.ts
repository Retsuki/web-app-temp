import { createClient as createServerClient } from '@/lib/supabase/server'

/**
 * サーバー環境でStorageクライアントを取得
 */
export async function getServerStorageClient() {
  const supabase = await createServerClient()
  return supabase.storage
}
