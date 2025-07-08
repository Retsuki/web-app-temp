import { createClient } from '@/lib/supabase/server'

/**
 * サーバーサイド（Route Handler、Server Components）で使用するOrvalクライアント
 * サーバーサイドのSupabaseクライアントを使用して認証トークンを取得します
 */
export const orvalServerClient = async <T>({
  url,
  method,
  params,
  data,
  headers,
  signal,
}: {
  url: string
  method: string
  params?: any
  data?: any
  headers?: any
  signal?: AbortSignal
}): Promise<T> => {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(params && {
      search: new URLSearchParams(params).toString(),
    }),
    ...(data && { body: JSON.stringify(data) }),
    signal,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API request failed' }))
    throw new Error(error.message || `API request failed: ${response.status}`)
  }

  // Handle empty responses
  const text = await response.text()
  if (!text) {
    return {} as T
  }

  try {
    return JSON.parse(text)
  } catch {
    return text as unknown as T
  }
}
