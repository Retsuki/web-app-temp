/**
 * API認証用のヘルパー関数
 * Google Cloud RunのIDトークン取得とヘッダー構築を共通化
 */

const METADATA_SERVER_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity'

export const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL

/**
 * Google Cloud Run環境でIDトークンを取得
 */
export async function getGoogleCloudIdToken(targetAudience: string): Promise<string | null> {
  if (!process.env.K_SERVICE) {
    return null
  }

  try {
    const response = await fetch(`${METADATA_SERVER_URL}?audience=${targetAudience}`, {
      headers: { 'Metadata-Flavor': 'Google' },
    })

    if (!response.ok) {
      console.error('Failed to get ID token from metadata server')
      return null
    }

    return await response.text()
  } catch (error) {
    console.error('Error getting ID token:', error)
    return null
  }
}

/**
 * API認証用のヘッダーを構築
 * Cloud Run環境ではGoogle IDトークンを使用し、Supabaseトークンは別ヘッダーで送信
 */
export async function getAuthHeaders(
  supabaseToken?: string | null,
  additionalHeaders?: HeadersInit
): Promise<Record<string, string>> {
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(additionalHeaders as Record<string, string>),
  }

  if (process.env.K_SERVICE && API_URL) {
    const idToken = await getGoogleCloudIdToken(API_URL)
    if (idToken) {
      requestHeaders.Authorization = `Bearer ${idToken}`
      if (supabaseToken) {
        requestHeaders['X-Supabase-Token'] = supabaseToken
      }
    } else if (supabaseToken) {
      requestHeaders.Authorization = `Bearer ${supabaseToken}`
    }
  } else if (supabaseToken) {
    requestHeaders.Authorization = `Bearer ${supabaseToken}`
  }

  return requestHeaders
}

/**
 * APIレスポンスをパース
 */
export async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'API request failed' }))
    throw new Error(error.message || `API request failed: ${response.status}`)
  }

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