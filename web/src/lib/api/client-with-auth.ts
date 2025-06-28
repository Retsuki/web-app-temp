import createClient from 'openapi-fetch'
import type { paths } from './schema'
import { createClient as createSupabase } from '@/lib/supabase/client'

// Client Component用の認証付きAPIクライアント
export const createAuthenticatedClient = () => {
  const supabase = createSupabase()
  
  return createClient<paths>({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1',
    headers: {
      'Content-Type': 'application/json',
    },
    fetch: async (input, init) => {
      // Supabaseのセッションを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      // 認証トークンをヘッダーに追加
      const headers = new Headers(init?.headers)
      if (session?.access_token) {
        headers.set('Authorization', `Bearer ${session.access_token}`)
      }
      
      return fetch(input, {
        ...init,
        headers,
      })
    },
  })
}