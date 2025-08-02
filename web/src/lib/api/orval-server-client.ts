import { createClient } from '@/lib/supabase/server'
import { API_URL, getAuthHeaders, parseResponse } from '../auth-helpers'

type RequestConfig = {
  url: string
  method: string
  params?: Record<string, string>
  data?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
}

/**
 * サーバーサイド（Route Handler、Server Components）で使用するOrvalクライアント
 * サーバーサイドのSupabaseクライアントを使用して認証トークンを取得します
 * Cloud Run環境では追加でGoogle IDトークンも取得します
 */
export const orvalServerClient = async <T>({
  url,
  method,
  params,
  data,
  headers,
  signal,
}: RequestConfig): Promise<T> => {
  const fullUrl = `${API_URL}${url}`

  // Supabaseトークンを取得
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const supabaseToken = session?.access_token

  // 認証ヘッダーを構築
  const requestHeaders = await getAuthHeaders(supabaseToken, headers)

  const searchParams = params ? `?${new URLSearchParams(params).toString()}` : ''
  const finalUrl = `${fullUrl}${searchParams}`
  
  // デバッグ用ログ
  console.log('API Request:', {
    url: finalUrl,
    method,
    hasSupabaseToken: !!supabaseToken,
    headers: Object.keys(requestHeaders),
    API_URL,
  })

  // APIヘルスチェック（デバッグ用）
  if (url === '/api/v1/users/me') {
    try {
      const healthUrl = `${API_URL}/api/v1/health`
      console.log('Checking API health at:', healthUrl)
      const healthCheck = await fetch(healthUrl)
      console.log('Health check response:', {
        status: healthCheck.status,
        statusText: healthCheck.statusText,
        headers: Object.fromEntries(healthCheck.headers.entries()),
      })
      if (healthCheck.ok) {
        const healthData = await healthCheck.json()
        console.log('Health check data:', healthData)
      } else {
        console.log('Health check body:', await healthCheck.text())
      }
    } catch (error) {
      console.error('Health check failed:', error)
    }
  }

  const response = await fetch(finalUrl, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    signal,
  })

  return parseResponse<T>(response)
}
