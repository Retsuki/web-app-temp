import type { MiddlewareHandler } from 'hono'
import type { AppContextVariables } from '../../../types/context.js'
import { AppHTTPException, ERROR_CODES } from '../../../utils/error/index.js'
import { extractSupabaseTokenFromHeader, extractToken } from '../_shared/token-utils.js'
import { getSupabaseAuthInfo } from './_utils.js'

/**
 * Supabase認証ミドルウェア
 *
 * Supabaseトークンを検証し、ユーザー情報を取得する。
 * 以下の順序でトークンを探す:
 * 1. X-Supabase-Tokenヘッダー
 * 2. Authorizationヘッダー（Bearer）
 * 3. Cookie
 */
export const supabaseAuthMiddleware: MiddlewareHandler<{
  Variables: AppContextVariables
}> = async (c, next) => {
  // X-Supabase-Tokenヘッダーを優先的にチェック
  let token = extractSupabaseTokenFromHeader(c)

  // X-Supabase-Tokenがない場合は通常のトークン取得
  if (!token) {
    token = extractToken(c)
  }

  if (!token) {
    throw new AppHTTPException(401, {
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'No authentication token provided',
    })
  }

  // Supabaseトークンの検証とユーザー情報の取得
  const authInfo = await getSupabaseAuthInfo(token)

  c.set('payload', authInfo.payload)
  c.set('userId', authInfo.userId)

  await next()
}
