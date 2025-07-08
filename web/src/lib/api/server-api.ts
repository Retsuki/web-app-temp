/**
 * サーバーサイドで使用するAPI関数
 * Orvalが生成する関数と同じインターフェースを提供しますが、
 * サーバーサイドのSupabaseクライアントを使用します
 */

import type { CreateUserRequest, CreateUserResponse } from '@/lib/api/generated/schemas'
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
