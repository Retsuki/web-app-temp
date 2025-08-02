import { createClient } from '@/lib/supabase/client'

export const orvalClient = async <T>({
  url,
  method,
  params,
  data,
  headers,
  signal,
}: {
  url: string
  method: string
  params?: Record<string, string>
  data?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
}): Promise<T> => {
  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token

  // APIプロキシを使用するか直接アクセスするかを判定
  // 本番環境（Cloud Run）ではプロキシ経由、開発環境では直接アクセス
  const apiUrl = process.env.NODE_ENV === 'production' 
    ? `/api/proxy${url}` 
    : `${process.env.NEXT_PUBLIC_API_URL}${url}`

  const response = await fetch(apiUrl, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(params && {
      search: new URLSearchParams(params as Record<string, string>).toString(),
    }),
    ...(data ? { body: JSON.stringify(data) } : {}),
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
