/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */

import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'

/**
 * アプリケーション設定
 * 環境変数の判定ロジックを一元化
 *
 * 注意: 環境変数はgetterで遅延評価されるため、
 * dotenvの初期化後に正しく値が取得されます
 */
export class AppConfig {
  // 一時ファイルパスのキャッシュ
  private static _tempCredentialsPath: string | undefined
  // 環境判定
  static get IS_PRODUCTION() {
    return process.env.NODE_ENV === 'production'
  }
  static get IS_DEVELOPMENT() {
    return process.env.NODE_ENV === 'development'
  }
  static get IS_TEST() {
    return process.env.NODE_ENV === 'test'
  }
  static get NODE_ENV() {
    return process.env.NODE_ENV || 'development'
  }

  // Cloud Run環境判定
  static get IS_CLOUD_RUN() {
    return !!(process.env.K_SERVICE || process.env.CLOUD_RUN_JOB)
  }
  static get K_SERVICE() {
    return process.env.K_SERVICE
  }
  static get K_REVISION() {
    return process.env.K_REVISION
  }
  static get CLOUD_RUN_JOB() {
    return process.env.CLOUD_RUN_JOB
  }

  // GCPプロジェクトID（優先順位付き）
  static get GCP_PROJECT_ID() {
    return (
      process.env.GOOGLE_CLOUD_PROJECT_ID ||
      process.env.GCP_PROJECT ||
      process.env.GCLOUD_PROJECT ||
      process.env.FIREBASE_PROJECT_ID ||
      ''
    )
  }

  // サーバー設定
  static get PORT() {
    return process.env.PORT || '8080'
  }
  static get API_URL() {
    return process.env.API_URL || `http://localhost:${AppConfig.PORT}`
  }

  // Supabase設定
  static get SUPABASE_URL() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  }
  static get SUPABASE_SERVICE_ROLE_KEY() {
    return process.env.SUPABASE_SERVICE_ROLE_KEY
  }
  static get SUPABASE_ANON_KEY() {
    return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  }

  // Firebase設定
  static get FIREBASE_PROJECT_ID() {
    return process.env.FIREBASE_PROJECT_ID
  }
  static get FIREBASE_CLIENT_EMAIL() {
    return process.env.FIREBASE_CLIENT_EMAIL
  }
  static get FIREBASE_PRIVATE_KEY() {
    return process.env.FIREBASE_PRIVATE_KEY
  }

  // Google認証設定
  static get GOOGLE_APPLICATION_CREDENTIALS() {
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS
    if (!credentials) {
      return undefined
    }

    // JSON文字列の場合、一時ファイルを作成してそのパスを返す
    if (credentials.startsWith('{')) {
      // 既にキャッシュされている場合はそれを返す
      if (AppConfig._tempCredentialsPath) {
        return AppConfig._tempCredentialsPath
      }

      try {
        // JSON文字列をパース（検証のため）
        const parsed = JSON.parse(credentials)

        // private_keyの改行文字を正しく変換
        if (parsed.private_key) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n')
        }

        // 一時ファイルを作成
        const tempDir = os.tmpdir()
        const tempPath = path.join(tempDir, 'google-credentials-temp.json')
        fs.writeFileSync(tempPath, JSON.stringify(parsed, null, 2))

        // キャッシュに保存
        AppConfig._tempCredentialsPath = tempPath

        // process.envも更新（一部のSDKが直接参照するため）
        process.env.GOOGLE_APPLICATION_CREDENTIALS = tempPath

        return tempPath
      } catch (error) {
        console.error('Failed to process GOOGLE_APPLICATION_CREDENTIALS:', error)
        return undefined
      }
    }

    // ファイルパスの場合はそのまま返す
    return credentials
  }

  // Stripe設定
  static get STRIPE_SECRET_KEY() {
    return process.env.STRIPE_SECRET_KEY
  }
  static get STRIPE_WEBHOOK_SECRET() {
    return process.env.STRIPE_WEBHOOK_SECRET
  }
  static get STRIPE_PRICE_ID_STANDARD_MONTHLY() {
    return process.env.STRIPE_PRICE_ID_STANDARD_MONTHLY
  }
  static get STRIPE_PRICE_ID_STANDARD_YEARLY() {
    return process.env.STRIPE_PRICE_ID_STANDARD_YEARLY
  }
  static get STRIPE_PRICE_ID_PRO_MONTHLY() {
    return process.env.STRIPE_PRICE_ID_PRO_MONTHLY
  }
  static get STRIPE_PRICE_ID_PRO_YEARLY() {
    return process.env.STRIPE_PRICE_ID_PRO_YEARLY
  }

  // Site URL
  static get NEXT_PUBLIC_SITE_URL() {
    return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }

  // 環境判定ヘルパーメソッド
  static isProduction(): boolean {
    return AppConfig.IS_PRODUCTION
  }

  static isDevelopment(): boolean {
    return AppConfig.IS_DEVELOPMENT
  }

  static isTest(): boolean {
    return AppConfig.IS_TEST
  }

  static isCloudRun(): boolean {
    return AppConfig.IS_CLOUD_RUN
  }

  // Firebase認証情報が揃っているかチェック
  static hasFirebaseCredentials(): boolean {
    return !!(
      AppConfig.FIREBASE_PROJECT_ID &&
      AppConfig.FIREBASE_CLIENT_EMAIL &&
      AppConfig.FIREBASE_PRIVATE_KEY
    )
  }

  // GCP認証が利用可能かチェック
  static hasGoogleCredentials(): boolean {
    return !!(
      AppConfig.IS_CLOUD_RUN ||
      AppConfig.GOOGLE_APPLICATION_CREDENTIALS ||
      AppConfig.hasFirebaseCredentials()
    )
  }

  // セキュリティ設定
  static get SECURITY_HEADERS_ENABLED() {
    // デフォルトは本番環境で有効
    const enabled = process.env.SECURITY_HEADERS_ENABLED
    if (enabled === undefined) {
      return AppConfig.IS_PRODUCTION || AppConfig.IS_CLOUD_RUN
    }
    return enabled === 'true'
  }

  // レート制限設定
  static get RATE_LIMIT_ENABLED() {
    // デフォルトは本番環境で有効
    const enabled = process.env.RATE_LIMIT_ENABLED
    if (enabled === undefined) {
      return AppConfig.IS_PRODUCTION || AppConfig.IS_CLOUD_RUN
    }
    return enabled === 'true'
  }

  static get RATE_LIMIT_WINDOW_MS() {
    const windowMs = process.env.RATE_LIMIT_WINDOW_MS
    return windowMs ? Number.parseInt(windowMs, 10) : 60 * 1000 // デフォルト: 1分
  }

  static get RATE_LIMIT_MAX_REQUESTS() {
    const maxRequests = process.env.RATE_LIMIT_MAX_REQUESTS
    return maxRequests ? Number.parseInt(maxRequests, 10) : 100 // デフォルト: 100リクエスト
  }

  // レート制限の詳細設定
  static get RATE_LIMIT_AUTH_MAX_REQUESTS() {
    const maxRequests = process.env.RATE_LIMIT_AUTH_MAX_REQUESTS
    return maxRequests ? Number.parseInt(maxRequests, 10) : 5 // 認証エンドポイント: 5リクエスト/分
  }

  static get RATE_LIMIT_CONTENT_GEN_MAX_REQUESTS() {
    const maxRequests = process.env.RATE_LIMIT_CONTENT_GEN_MAX_REQUESTS
    return maxRequests ? Number.parseInt(maxRequests, 10) : 10 // コンテンツ生成: 10リクエスト/分
  }

  // セキュリティヘッダーが有効かチェック
  static get IS_SECURITY_HEADERS_ENABLED() {
    return AppConfig.SECURITY_HEADERS_ENABLED
  }

  // レート制限が有効かチェック
  static get IS_RATE_LIMIT_ENABLED() {
    return AppConfig.RATE_LIMIT_ENABLED
  }

  // Supabase設定が揃っているかチェック
  static hasSupabaseConfig(): boolean {
    return !!(AppConfig.SUPABASE_URL && AppConfig.SUPABASE_SERVICE_ROLE_KEY)
  }
}
