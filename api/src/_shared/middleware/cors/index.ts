import { cors } from 'hono/cors'

// CORS設定を共通化して再利用できるようにする
export const corsMiddleware = cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3333',
    'https://web-app-web-180146147603.asia-northeast1.run.app',
    '*',
  ], // 必要に応じて変更
  credentials: true, // Cookieや認証情報の送信を許可
  maxAge: 86400, // オプションリクエストのキャッシュ時間（秒）
})
