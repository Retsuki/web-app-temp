/**
 * 認証関連の内部ヘルパー関数
 * auth-actions.tsから呼び出される内部ロジックを管理
 */

import type { User } from '@supabase/supabase-js'
import { getApiV1UsersMeServer, postApiV1AuthSetupServer } from '@/lib/api/server-api'
import { createClient } from '@/lib/supabase/server'
import type { AuthActionResult } from '../types'

/**
 * 新規ユーザーのプロフィールとプロジェクトを作成
 */
export async function createUserProfileAndProject(
  user: User,
  nickname?: string,
  language = 'ja'
): Promise<{
  success: boolean
  profileId: string
  projectId: string
  error?: string
}> {
  try {
    // API経由でセットアップ（認証ヘッダーは自動的に設定される）
    const result = await postApiV1AuthSetupServer({
      userId: user.id,
      email: user.email!,
      nickname: getDefaultNickname(user, nickname),
      language,
    })

    return {
      success: true,
      profileId: result.data.profileId,
      projectId: result.data.projectId,
    }
  } catch (error) {
    return authActionError(error)
  }
}

/**
 * ユーザーの言語設定を取得
 * プロフィールから言語設定を取得し、存在しない場合はデフォルト値を返す
 */
export async function getUserLanguage(defaultLang = 'ja'): Promise<string> {
  try {
    const result = await getApiV1UsersMeServer()
    return result?.data?.language || defaultLang
  } catch (error) {
    console.error('Failed to fetch user profile language:', error)
    return defaultLang
  }
}

/**
 * デフォルトのニックネームを生成
 */
export function getDefaultNickname(user: User, nickname?: string): string {
  return (
    nickname ||
    user.user_metadata.full_name ||
    user.user_metadata.name ||
    user.email?.split('@')[0] ||
    'User'
  )
}

/**
 * エラー時にユーザーを削除（クリーンアップ）
 */
export async function deleteUserOnError(userId: string): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.auth.admin?.deleteUser(userId)
  } catch (deleteError) {
    console.error('Failed to delete user after setup failure:', deleteError)
  }
}

/**
 * エラーメッセージを取得
 */
export function authActionError(error: unknown): AuthActionResult {
  console.error('❌【ERROR】auth error: ', error)

  return {
    success: false,
    profileId: '',
    projectId: '',
    error: `エラーが発生しました: ${error instanceof Error ? error.message : String(error)}`,
  }
}
