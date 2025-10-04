import type { MiddlewareHandler } from 'hono'
import { secureHeaders } from 'hono/secure-headers'
import { AppConfig } from '../../constants/config.js'

/**
 * セキュリティヘッダーミドルウェア
 *
 * Honoの公式secureHeadersミドルウェアを使用して、
 * 包括的なセキュリティヘッダーを設定します。
 * 追加でCache-Controlヘッダーも設定します。
 *
 * 参考: https://hono.dev/docs/middleware/builtin/secure-headers
 */
export const securityHeadersMiddleware = (): MiddlewareHandler => {
  // 環境に応じた設定
  const isDevelopment = AppConfig.isDevelopment() || AppConfig.isTest()
  const isProduction = AppConfig.IS_PRODUCTION || AppConfig.IS_CLOUD_RUN

  // secureHeadersミドルウェアを取得
  const secureHeadersHandler = secureHeaders({
    // Content Security Policy（デフォルト: 未設定）
    contentSecurityPolicy: isDevelopment
      ? {
          // 開発環境では緩めの設定
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:', 'http:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https:', 'http:'],
          imgSrc: ["'self'", 'data:', 'https:', 'http:'],
          fontSrc: ["'self'", 'data:', 'https:', 'http:'],
          connectSrc: ["'self'", 'https:', 'http:', 'ws:', 'wss:'],
          mediaSrc: ["'self'", 'https:', 'http:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          workerSrc: ["'self'", 'blob:'],
        }
      : {
          // 本番環境では厳格な設定
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"], // unsafe-evalは将来的に削除
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https:'],
          mediaSrc: ["'self'", 'https:'],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
          workerSrc: ["'self'"],
        },

    // Cross-Origin設定（デフォルトと異なる設定のみ）
    crossOriginEmbedderPolicy: false, // デフォルト: false
    crossOriginResourcePolicy: 'cross-origin', // デフォルト: 'same-origin' → APIは異なるオリジンからアクセスされるため変更
    // crossOriginOpenerPolicy: デフォルト値（'same-origin'）と同じなので省略

    // カスタマイズが必要なヘッダーのみ設定
    referrerPolicy: 'strict-origin-when-cross-origin', // デフォルト: 'no-referrer' → より適切な設定に変更
    strictTransportSecurity: isProduction
      ? 'max-age=31536000; includeSubDomains; preload' // より長い期間とpreloadを追加
      : false, // 開発環境ではHTSを無効化
    xFrameOptions: 'DENY', // デフォルト: 'SAMEORIGIN' → より厳格に
    // xXssProtection: デフォルト値（'0'）と同じなので省略
    // xContentTypeOptions: デフォルト値（'nosniff'）と同じなので省略
    // xDnsPrefetchControl: デフォルト値（'off'）と同じなので省略
    // xDownloadOptions: デフォルト値（'noopen'）と同じなので省略
    // xPermittedCrossDomainPolicies: デフォルト値（'none'）と同じなので省略
    // originAgentCluster: デフォルト値（'?1'）と同じなので省略

    // Permissions Policy（デフォルト: 未設定）
    permissionsPolicy: {
      camera: false,
      microphone: false,
      geolocation: false,
      payment: false,
      usb: false,
      accelerometer: false,
      gyroscope: false,
      magnetometer: false,
      fullscreen: false,
    },
  })

  // Cache-Controlヘッダーを追加するカスタムミドルウェアと組み合わせる
  return async (c, next) => {
    // secureHeadersミドルウェアを実行
    await secureHeadersHandler(c, next)

    // Cache-Controlヘッダーを追加
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  }
}
