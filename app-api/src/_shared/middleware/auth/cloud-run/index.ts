import type { MiddlewareHandler } from 'hono'
import type { AppContextVariables } from '../../../types/context.js'
import { AppHTTPException, ERROR_CODES } from '../../../utils/error/index.js'
import { extractToken } from '../_shared/token-utils.js'
import { isCloudRunEnvironment, verifyGoogleIdToken } from './_utils.js'

/**
 * Cloud Run認証ミドルウェア
 *
 * Cloud Run環境でのサービス間通信で使用される。
 * Google IDトークンを検証し、有効な場合は認証を通す。
 *
 * @example
 * // サービス間通信API
 * app.use('/api/internal/*', cloudRunAuthMiddleware)
 */
export const cloudRunAuthMiddleware: MiddlewareHandler<{
  Variables: AppContextVariables
}> = async (c, next) => {
  // Cloud Run環境でない場合はスキップ
  if (!isCloudRunEnvironment()) {
    await next()
    return
  }

  const token = extractToken(c)

  if (!token) {
    throw new AppHTTPException(401, {
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'No authentication token provided',
    })
  }

  const googlePayload = await verifyGoogleIdToken(token)

  if (!googlePayload) {
    throw new AppHTTPException(401, {
      code: ERROR_CODES.UNAUTHORIZED,
      message: 'Invalid Google ID token',
    })
  }

  await next()
}
