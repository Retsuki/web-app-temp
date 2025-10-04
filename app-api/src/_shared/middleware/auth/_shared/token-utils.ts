import type { Context } from 'hono'
import { getCookie } from 'hono/cookie'

/**
 * リクエストからトークンを取得する
 * 1. Cookieから取得を試みる
 * 2. AuthorizationヘッダーのBearerトークンから取得を試みる
 */
export function extractToken(c: Context): string | null {
  // Cookieからトークンを取得
  let token = getCookie(c, 'token')

  // CookieにトークンがなければAuthorizationヘッダーから取得
  if (!token) {
    const authHeader = c.req.header('Authorization')
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.substring(7) // "Bearer "を除去
    }
  }

  return token || null
}

/**
 * X-Supabase-Tokenヘッダーからトークンを取得する
 */
export function extractSupabaseTokenFromHeader(c: Context): string | null {
  return c.req.header('X-Supabase-Token') || null
}
