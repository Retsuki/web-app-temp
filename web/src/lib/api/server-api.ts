/**
 * サーバーサイドで使用するAPI関数
 * Orvalが生成する関数と同じインターフェースを提供しますが、
 * サーバーサイドのSupabaseクライアントを使用します
 */

import type {
  GetApiV1ProjectsId200,
  GetProfile200,
  PostApiV1AuthSetup201,
  PostApiV1AuthSetupBody,
} from '@/lib/api/generated/schemas'
import { orvalServerClient } from './orval-server-client'

// プロフィール取得用のAPI関数
export const getApiV1UsersMeServer = (signal?: AbortSignal) => {
  return orvalServerClient<GetProfile200>({
    url: '/api/v1/users/me',
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  })
}

// 新規ユーザーのセットアップ用のAPI関数
// Supabase Auth でユーザー作成後、プロフィールと初期プロジェクトを作成します
export const postApiV1AuthSetupServer = (
  setupData: PostApiV1AuthSetupBody,
  signal?: AbortSignal
) => {
  return orvalServerClient<PostApiV1AuthSetup201>({
    url: '/api/v1/auth/setup',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data: setupData,
    signal,
  })
}

// プロジェクト詳細取得用のAPI関数
export const getApiV1ProjectsProjectIdServer = async (
  projectId: string,
  signal?: AbortSignal
): Promise<GetApiV1ProjectsId200> => {
  const response = await orvalServerClient<GetApiV1ProjectsId200>({
    url: `/api/v1/projects/${projectId}`,
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  })

  // 現在のOpenAPIスキーマではフラットなプロジェクトオブジェクトを返す
  return response
}
