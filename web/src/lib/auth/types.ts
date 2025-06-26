export interface SignUpData {
  email: string
  password: string
  nickname: string
}

export interface SignInData {
  email: string
  password: string
}

export interface AuthError {
  message: string
  status?: number
}