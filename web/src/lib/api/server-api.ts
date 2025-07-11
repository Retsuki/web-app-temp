/**
 * サーバーサイドで使用するAPI関数
 * Orvalが生成する関数と同じインターフェースを提供しますが、
 * サーバーサイドのSupabaseクライアントを使用します
 */

import type {
  CreateUserRequest,
  CreateUserResponse,
  GetApiV1UsersMe200,
} from '@/lib/api/generated/schemas'
import { orvalServerClient } from './orval-server-client'

export const postApiV1UsersServer = (
  createUserRequest: CreateUserRequest,
  signal?: AbortSignal
) => {
  return orvalServerClient<CreateUserResponse>({
    url: '/api/v1/users',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: createUserRequest,
    signal,
  })
}

// プロフィール取得用のAPI関数
export const getApiV1UsersMeServer = (signal?: AbortSignal) => {
  return orvalServerClient<GetApiV1UsersMe200>({
    url: '/api/v1/users/me',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  })
}
