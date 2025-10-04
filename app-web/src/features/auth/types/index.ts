export interface SignUpData {
  email: string
  password: string
  nickname: string
  lang?: string
}

export interface SignInData {
  email: string
  password: string
  lang?: string
}

export interface AuthError {
  message: string
  status?: number
}

/**
 * 認証アクションのレスポンス型
 */
export interface AuthActionResult {
  success: boolean
  profileId: string
  projectId: string
  error?: string
  redirectTo?: string
}
