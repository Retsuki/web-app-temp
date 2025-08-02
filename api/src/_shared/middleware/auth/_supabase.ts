import { verify } from 'hono/jwt'
import type { SupabaseJWTPayload } from '../../types/context.js'
import { AppHTTPException, ERROR_CODES } from '../../utils/error/index.js'

/**
 * Supabaseトークンを検証する
 * @param token JWTトークン
 * @returns 検証されたペイロード
 * @throws {AppHTTPException} トークンが無効な場合
 */
export async function verifySupabaseToken(token: string): Promise<SupabaseJWTPayload> {
  const jwtSecret = process.env.SUPABASE_JWT_SECRET
  if (!jwtSecret) {
    throw new AppHTTPException(500, {
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'JWT secret is not configured',
    })
  }

  try {
    const payload = (await verify(token, jwtSecret)) as SupabaseJWTPayload
    return payload
  } catch (error) {
    throw new AppHTTPException(401, {
      code: ERROR_CODES.INVALID_TOKEN,
      message: 'Invalid Supabase token',
      cause: JSON.stringify(error),
    })
  }
}

/**
 * Supabase認証情報を取得する
 * @param token JWTトークン
 * @returns ユーザーIDとペイロード
 */
export async function getSupabaseAuthInfo(token: string): Promise<{
  userId: string
  payload: SupabaseJWTPayload
}> {
  const payload = await verifySupabaseToken(token)
  return {
    userId: payload.sub,
    payload,
  }
}
