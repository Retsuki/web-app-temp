import type { ServiceContainer } from '../middleware/service-container/index.js'

export type SupabaseJWTPayload = {
  iss: string // 発行者(issuer)
  sub: string // ユーザーIDなどの一意識別子
  aud: string // 対象(audience)、ここでは "authenticated"
  exp: number // 有効期限（UNIXタイムスタンプ）
  iat: number // 発行日時（UNIXタイムスタンプ）
  email: string // ユーザーのメールアドレス
  phone: string // ユーザーの電話番号（空文字の場合もあり）
  app_metadata: {
    provider: string // 認証プロバイダ (e.g. "email")
    providers: string[] // 利用可能な認証プロバイダの配列
  }
  user_metadata: {
    email: string
    email_verified: boolean
    phone_verified: boolean
    sub: string // ユーザーIDなど
  }
  role: string // ユーザーロール (e.g. "authenticated")
  aal: string // Authentication Assurance Level (e.g. "aal1")
  amr: {
    method: string // 認証手段 (e.g. "password")
    timestamp: number // 認証時刻（UNIXタイム）
  }[]
  session_id: string // セッションID
  is_anonymous: boolean // 匿名ユーザーかどうか
}

// user情報を含むContextの型
export type AppContextVariables = {
  payload?: SupabaseJWTPayload
  userId?: string
}

export type AppEnv = {
  Variables: AppContextVariables
}

declare module 'hono' {
  interface ContextVariableMap {
    services: ServiceContainer
  }
}
