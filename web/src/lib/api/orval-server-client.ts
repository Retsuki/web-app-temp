import { createClient } from '@/lib/supabase/server'

const METADATA_SERVER_URL =
  'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity'

const API_URL = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL

type RequestConfig = {
  url: string
  method: string
  params?: Record<string, string>
  data?: unknown
  headers?: HeadersInit
  signal?: AbortSignal
}

export const orvalServerClient = async <T>({
  url,
  method,
  params,
  data,
  headers,
  signal,
}: RequestConfig): Promise<T> => {
  const fullUrl = `${API_URL}${url}`

  const requestHeaders = await getAuthHeaders(headers)

  const searchParams = params ? `?${new URLSearchParams(params).toString()}` : ''
  const response = await fetch(`${fullUrl}${searchParams}`, {
    method,
    headers: requestHeaders,
    body: data ? JSON.stringify(data) : undefined,
    signal,
  })

  return parseResponse<T>(response)
}

async function getGoogleCloudIdToken(targetAudience: string): Promise<string | null> {
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

async function getAuthHeaders(headers?: HeadersInit): Promise<Record<string, string>> {
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(headers as Record<string, string>),
  }

  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const supabaseToken = session?.access_token

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

async function parseResponse<T>(response: Response): Promise<T> {
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
