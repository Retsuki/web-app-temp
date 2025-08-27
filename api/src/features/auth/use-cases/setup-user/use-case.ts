import { createClient } from '@supabase/supabase-js'
import { AppConfig } from '../../../../_shared/constants/config.js'
import { ERROR_CODES } from '../../../../_shared/utils/error/error-code.js'
import { AppHTTPException } from '../../../../_shared/utils/error/error-exception.js'
import { logger } from '../../../../_shared/utils/logger.js'
import type { ProjectRepository } from '../../../projects/repositories/project.repository.js'
import type { UserRepository } from '../../../users/repositories/user.repository.js'
import type { SetupUserRequest, SetupUserResponse } from './dto.js'

export class SetupUserUseCase {
  private supabaseAdmin: ReturnType<typeof createClient>

  constructor(
    private readonly userRepository: UserRepository,
    private readonly projectRepository: ProjectRepository
  ) {
    // Admin クライアントの初期化（ユーザー削除用）
    const supabaseUrl = AppConfig.SUPABASE_URL
    const supabaseServiceKey = AppConfig.SUPABASE_SERVICE_ROLE_KEY
    if (!AppConfig.hasSupabaseConfig()) {
      throw new AppHTTPException(500, {
        message: 'Supabase環境変数が設定されていません',
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      })
    }

    this.supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  async execute(data: SetupUserRequest): Promise<SetupUserResponse> {
    try {
      // 1. プロフィールが既に存在するか確認
      const existingProfile = await this.userRepository.findByUserId(data.userId)

      if (existingProfile) {
        // 既存ユーザーの場合、プロジェクトを取得
        const projects = await this.projectRepository.findByUserId(data.userId)

        return {
          success: true,
          data: {
            profileId: existingProfile.id,
            projectId: projects[0]?.id || '',
            redirectTo: `/${existingProfile.language || 'ja'}/projects`,
          },
          metadata: {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
          },
        }
      }

      // 2. 新規プロフィール作成
      const profile = await this.userRepository.create({
        userId: data.userId,
        email: data.email,
        nickname: data.nickname,
        language: data.language,
        plan: 'free',
        remainedCredits: 500,
      })

      // 3. 初期プロジェクト作成
      const projectName = data.nickname
        ? `${data.nickname}の最初のプロジェクト`
        : 'マイプロジェクト'

      const project = await this.projectRepository.create({
        name: projectName,
        userId: data.userId,
      })

      // 4. 成功レスポンス
      return {
        success: true,
        data: {
          profileId: profile.id,
          projectId: project.id,
          redirectTo: `/${data.language}/projects/${project.id}`,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      }
    } catch (error) {
      // エラー時はSupabase Auth のユーザーを削除
      logger.error(
        {
          error,
        },
        'ユーザーセットアップエラー'
      )

      try {
        const { error: deleteError } = await this.supabaseAdmin.auth.admin.deleteUser(data.userId)
        if (deleteError) {
          logger.error(
            {
              error: deleteError,
            },
            'ユーザー削除エラー'
          )
        }
      } catch (deleteError) {
        logger.error(
          {
            error: deleteError,
          },
          'ユーザー削除に失敗'
        )
      }

      // エラーを再スロー
      throw error
    }
  }
}
