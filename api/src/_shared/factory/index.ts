import { OpenAPIHono } from '@hono/zod-openapi'
import type { AppEnv } from '../types/context.js'
import { handleError, handleZodError } from '../utils/error/index.js'
import {
  setupAuthentication,
  setupBasicMiddleware,
  setupCorsMiddleware,
  setupRateLimiting,
  setupSecurityHeaders,
  setupSwaggerUI,
} from './_middleware-setup.js'

/**
 * APIアプリケーションのファクトリー関数
 * 各種ミドルウェアとエラーハンドリングを設定したHonoアプリケーションを作成します。
 */
export const createApp = () => {
  // OpenAPIHonoアプリケーションの初期化
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: handleZodError,
  }).basePath('/api/v1')

  // グローバルエラーハンドラーの設定
  app.onError(handleError)

  // ミドルウェアの設定（順序が重要）
  // 1. CORS（プリフライトリクエストのため最初に設定）
  setupCorsMiddleware(app)

  // 2. 基本ミドルウェア（ロギング、リクエストIDなど）
  setupBasicMiddleware(app)

  // 3. セキュリティヘッダー
  setupSecurityHeaders(app)

  // 4. レート制限
  setupRateLimiting(app)

  // 5. 認証（Cloud Run IAM → Supabase）
  setupAuthentication(app)

  // 6. Swagger UI（開発環境のみ）
  setupSwaggerUI(app)

  return app
}

export type App = ReturnType<typeof createApp>
