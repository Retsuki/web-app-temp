/**
 * サーバーサイドで使用するAPI関数
 * Orvalが生成する関数と同じインターフェースを提供しますが、
 * サーバーサイドのSupabaseクライアントを使用します
 */

import type {
  CreateUserRequest,
  CreateUserResponse,
  GetApiV1UsersMe200,
  GetApiV1ProjectsProjectId200,
  GetApiV1ProjectsProjectId200Project,
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

// プロジェクト詳細取得用のAPI関数
export const getApiV1ProjectsProjectIdServer = async (projectId: string, signal?: AbortSignal) => {
  const response = await orvalServerClient<GetApiV1ProjectsProjectId200>({
    url: `/api/v1/projects/${projectId}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  })
  
  // APIレスポンスがproject属性を持つ場合と持たない場合の両方に対応
  if ('project' in response && response.project) {
    return response.project
  }
  return response
}
