import type { Context, MiddlewareHandler } from 'hono'
import { rateLimiter } from 'hono-rate-limiter'
import { AppConfig } from '../../constants/config.js'
import type { AppContextVariables } from '../../types/context.js'
import { AppHTTPException, ERROR_CODES } from '../../utils/error/index.js'

/**
 * デフォルトのキー生成関数
 * IPアドレスとユーザーIDを組み合わせて識別
 */
const defaultKeyGenerator = (c: Context<{ Variables: AppContextVariables }>): string => {
  // ユーザーIDがある場合は優先
  const userId = c.get('userId')
  if (userId) {
    return `user:${userId}`
  }

  // IPアドレスを取得（プロキシ経由の場合も考慮）
  const ip =
    c.req.header('x-forwarded-for')?.split(',')[0]?.trim() || c.req.header('x-real-ip') || 'unknown'

  return `ip:${ip}`
}

/**
 * レート制限エラーハンドラー
 */
const rateLimitErrorHandler = (c: Context): Response => {
  throw new AppHTTPException(429, {
    code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    message: 'Too many requests, please try again later.',
    cause: {
      retryAfter: c.get('retryAfter'),
    },
  })
}

/**
 * レート制限ミドルウェアファクトリー
 *
 * hono-rate-limiterを使用した簡潔な実装
 *
 * @param windowMs 時間窓（ミリ秒）
 * @param limit 最大リクエスト数
 * @param message エラーメッセージ（オプション）
 * @returns ミドルウェアハンドラー
 *
 * @example
 * ```typescript
 * // デフォルト設定（100リクエスト/分）
 * app.use(rateLimitMiddleware())
 *
 * // カスタム設定
 * app.use('/api/v1/auth/*', rateLimitMiddleware({
 *   windowMs: 60 * 1000, // 1分
 *   maxRequests: 5, // 5リクエスト
 *   message: '認証リクエストが多すぎます。しばらくお待ちください。'
 * }))
 * ```
 */
export const rateLimitMiddleware = (
  config: { windowMs?: number; maxRequests?: number; message?: string } = {}
): MiddlewareHandler<{ Variables: AppContextVariables }> => {
  // レート制限が無効化されている場合は何もしないミドルウェアを返す
  if (!AppConfig.IS_RATE_LIMIT_ENABLED) {
    return async (_c, next) => {
      await next()
    }
  }

  const windowMs = config.windowMs || 60 * 1000 // デフォルト: 1分
  const limit = config.maxRequests || 100 // デフォルト: 100リクエスト
  const customMessage = config.message

  return rateLimiter({
    windowMs,
    limit,
    standardHeaders: 'draft-6', // RateLimit headers を使用
    keyGenerator: defaultKeyGenerator,
    handler: (c: Context) => {
      // カスタムメッセージがある場合は設定
      if (customMessage) {
        throw new AppHTTPException(429, {
          code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
          message: customMessage,
          cause: {
            limit,
            windowMs,
            retryAfter: c.get('retryAfter'),
          },
        })
      }
      // デフォルトハンドラーを使用
      return rateLimitErrorHandler(c)
    },
  })
}

/**
 * エンドポイント別のレート制限設定を作成
 *
 * @example
 * ```typescript
 * const limits = createEndpointLimits({
 *   auth: { windowMs: 60000, maxRequests: 5 },
 *   content: { windowMs: 60000, maxRequests: 10 },
 *   default: { windowMs: 60000, maxRequests: 100 }
 * })
 *
 * app.use('/api/v1/auth/*', limits.auth)
 * app.use('/api/v1/contents/generate/*', limits.content)
 * app.use('/*', limits.default)
 * ```
 */
export const createEndpointLimits = (
  configs: Record<string, { windowMs?: number; maxRequests?: number; message?: string }>
): Record<string, MiddlewareHandler<{ Variables: AppContextVariables }>> => {
  const limits: Record<string, MiddlewareHandler<{ Variables: AppContextVariables }>> = {}

  for (const [key, config] of Object.entries(configs)) {
    limits[key] = rateLimitMiddleware(config)
  }

  return limits
}

/**
 * @deprecated hono-rate-limiterは自動的にメモリ管理を行うため不要
 */
export const cleanupRateLimitStore = (): void => {
  // No-op: hono-rate-limiterが自動的に管理
}
