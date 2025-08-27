import type { MiddlewareHandler } from 'hono'
import type { AppContextVariables } from '../../types/context.js'

/**
 * 認証プラットフォームの種類
 */
export type AuthPlatform = 'supabase' | 'cloud-run' | 'hybrid'

/**
 * 認証ミドルウェアのインターフェース
 */
export type AuthMiddleware = MiddlewareHandler<{
  Variables: AppContextVariables
}>

/**
 * 認証設定
 */
export interface AuthConfig {
  /**
   * 使用する認証プラットフォーム
   */
  platform?: AuthPlatform

  /**
   * Cloud Run環境での自動検出を有効にするか
   */
  autoDetectCloudRun?: boolean
}
