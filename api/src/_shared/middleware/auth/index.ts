import type { Context, MiddlewareHandler } from 'hono'
import type { AppContextVariables, SupabaseJWTPayload } from '../../types/context.js'
import { AppHTTPException, ERROR_CODES } from '../../utils/error/index.js'
import { isCloudRunEnvironment, verifyGoogleIdToken } from './_google.js'
import { getSupabaseAuthInfo } from './_supabase.js'
import { extractSupabaseTokenFromHeader, extractToken } from './_utils.js'

/**
 * 認証ミドルウェア
 *
 * 以下の順序で認証を試みる:
 * 1. Cloud Run環境の場合: Google IDトークン + Supabaseトークン
 * 2. X-Supabase-Tokenヘッダーの検証
 * 3. 通常のSupabaseトークン検証 (CookieまたはAuthorizationヘッダー)
 */
export const authMiddleware: MiddlewareHandler<{
  Variables: AppContextVariables
}> = async (c, next) => {
  // トークンを取得
  const token = extractToken(c)

  if (!token) {
    throw new AppHTTPException(401, {
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'No authentication token provided',
    })
  }

  // Cloud Run環境でのGoogle IDトークン認証
  if (isCloudRunEnvironment()) {
    const result = await handleCloudRunAuth(c, token)
    if (result.authenticated) {
      c.set('payload', result.payload)
      c.set('userId', result.userId)
      await next()
      return
    }
  }

  // X-Supabase-Tokenヘッダーによる認証
  const supabaseTokenFromHeader = extractSupabaseTokenFromHeader(c)
  if (supabaseTokenFromHeader) {
    const authInfo = await getSupabaseAuthInfo(supabaseTokenFromHeader)
    c.set('payload', authInfo.payload)
    c.set('userId', authInfo.userId)
    await next()
    return
  }

  // 通常のSupabase認証
  const authInfo = await getSupabaseAuthInfo(token)
  c.set('payload', authInfo.payload)
  c.set('userId', authInfo.userId)
  await next()
}

/**
 * Cloud Run環境での認証処理
 */
async function handleCloudRunAuth(
  c: Context,
  token: string
): Promise<{
  authenticated: boolean
  userId: string
  payload: SupabaseJWTPayload
}> {
  const googlePayload = await verifyGoogleIdToken(token)

  if (!googlePayload) {
    return {
      authenticated: false,
      userId: '',
      payload: {} as SupabaseJWTPayload,
    }
  }

  // X-Supabase-Tokenヘッダーがある場合は、実際のユーザー情報を取得
  const supabaseToken = extractSupabaseTokenFromHeader(c)
  if (supabaseToken) {
    try {
      const authInfo = await getSupabaseAuthInfo(supabaseToken)
      return {
        authenticated: true,
        userId: authInfo.userId,
        payload: authInfo.payload,
      }
    } catch {
      // Supabaseトークンが無効でもGoogle IDトークンが有効なら続行
      console.warn('Invalid Supabase token with valid Google ID token')
    }
  }

  // Google IDトークンのみで認証（サービス間通信）
  return {
    authenticated: true,
    userId: 'service-account',
    payload: {} as SupabaseJWTPayload,
  }
}
