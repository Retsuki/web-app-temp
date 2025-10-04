/**
 * 認証除外パス設定
 *
 * これらのパスは認証なしでアクセス可能です。
 */

/**
 * Cloud Run IAM認証とSupabase認証の両方を除外するパス
 */
export const PUBLIC_PATHS = [
  // ヘルスチェック
  '/api/v1/health',

  // OpenAPI ドキュメント（ローカル環境のみ）
  '/api/v1/ui',
  '/api/v1/doc',

  // Stripe Webhook（署名検証で認証）
  '/api/v1/stripe/webhook',
]

/**
 * Supabase認証のみ除外するパス（Cloud Run IAM認証は必要）
 */
export const SUPABASE_AUTH_EXCLUDED_PATHS = [
  // ユーザー作成（新規登録時に必要）
  '/api/v1/users',
]

/**
 * Supabase認証を除外する全パス
 */
export const ALL_SUPABASE_EXCLUDED_PATHS = [...PUBLIC_PATHS, ...SUPABASE_AUTH_EXCLUDED_PATHS]
