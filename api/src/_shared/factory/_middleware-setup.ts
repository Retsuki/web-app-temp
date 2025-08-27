import { swaggerUI } from '@hono/swagger-ui'
import type { OpenAPIHono } from '@hono/zod-openapi'
import { except } from 'hono/combine'
import { logger } from 'hono/logger'
import { poweredBy } from 'hono/powered-by'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { AppConfig } from '../constants/config.js'
import {
  cloudRunAuthMiddleware,
  corsMiddleware,
  rateLimitMiddleware,
  securityHeadersMiddleware,
  serviceContainerMiddleware,
  supabaseAuthMiddleware,
} from '../middleware/index.js'
import type { AppEnv } from '../types/context.js'
import { ALL_SUPABASE_EXCLUDED_PATHS, PUBLIC_PATHS } from './_auth-paths.js'

/** 基本ミドルウェア（ロギング、リクエストID、サービスコンテナ） */
export const setupBasicMiddleware = (app: OpenAPIHono<AppEnv>) => {
  app.use(prettyJSON(), logger(), requestId())
  app.use(serviceContainerMiddleware)
}

/** CORS設定（プリフライトリクエスト含む） */
export const setupCorsMiddleware = (app: OpenAPIHono<AppEnv>) => {
  app.use('/*', corsMiddleware)
  app.options('/*', (c) => c.text('', 200)) // プリフライト用
}

/** セキュリティヘッダー */
export const setupSecurityHeaders = (app: OpenAPIHono<AppEnv>) => {
  if (AppConfig.IS_SECURITY_HEADERS_ENABLED) {
    app.use('/*', securityHeadersMiddleware())
  } else {
    app.use(poweredBy()) // X-Powered-By削除のみ
  }
}

/** エンドポイント別レート制限 */
export const setupRateLimiting = (app: OpenAPIHono<AppEnv>) => {
  if (!AppConfig.IS_RATE_LIMIT_ENABLED) {
    return
  }

  // 認証: 5リクエスト/分
  app.use(
    '/api/v1/auth/*',
    rateLimitMiddleware({
      windowMs: AppConfig.RATE_LIMIT_WINDOW_MS,
      maxRequests: AppConfig.RATE_LIMIT_AUTH_MAX_REQUESTS,
      message: '認証リクエストが多すぎます。しばらくお待ちください。',
    })
  )

  // その他: 100リクエスト/分
  app.use(
    '/*',
    rateLimitMiddleware({
      windowMs: AppConfig.RATE_LIMIT_WINDOW_MS,
      maxRequests: AppConfig.RATE_LIMIT_MAX_REQUESTS,
    })
  )
}

/** 認証ミドルウェア（Cloud Run IAM → Supabase） */
export const setupAuthentication = (app: OpenAPIHono<AppEnv>) => {
  app.use('/*', except([...PUBLIC_PATHS], cloudRunAuthMiddleware))
  app.use('*', except([...ALL_SUPABASE_EXCLUDED_PATHS], supabaseAuthMiddleware))
}

/** Swagger UI（開発環境のみ） */
export const setupSwaggerUI = (app: OpenAPIHono<AppEnv>) => {
  const isDevelopment = !AppConfig.IS_PRODUCTION && !AppConfig.IS_CLOUD_RUN

  if (isDevelopment) {
    app.get('/ui', swaggerUI({ url: '/api/v1/doc' }))
    app.doc('/doc', {
      openapi: '3.0.0',
      info: {
        title: 'Perfect Marketing Tool API',
        version: '1.0.0',
        description: 'AI駆動型マーケティングコンテンツ自動生成ツールのAPI',
      },
    })
  } else {
    app.get('/ui', (c) => c.json({ error: 'Not found' }, 404))
    app.get('/doc', (c) => c.json({ error: 'Not found' }, 404))
  }
}
