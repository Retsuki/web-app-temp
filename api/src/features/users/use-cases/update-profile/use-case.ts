import { AppHTTPException, ERROR_CODES } from '../../../../_shared/utils/error/index.js'
import type { UserRepository } from '../../repositories/user.repository.js'
import type { UpdateProfileReq, UserProfileRes } from './dto.js'

export class UpdateUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string, data: UpdateProfileReq): Promise<UserProfileRes> {
    // プロフィールの存在確認
    const existingProfile = await this.userRepository.findByUserId(userId)
    if (!existingProfile) {
      throw new AppHTTPException(404, {
        code: ERROR_CODES.PROFILE_NOT_FOUND,
        message: 'プロフィールが見つかりません',
      })
    }

    // 更新データの準備
    const updateData = {
      ...(data.nickname !== undefined && { nickname: data.nickname }),
      ...(data.language !== undefined && { language: data.language }),
    }

    // プロフィールを更新
    const updatedProfile = await this.userRepository.update(userId, updateData)

    // レスポンス形式に変換
    return {
      id: updatedProfile.id,
      userId: updatedProfile.userId,
      email: updatedProfile.email,
      nickname: updatedProfile.nickname,
      language: updatedProfile.language || 'ja',
      createdAt: updatedProfile.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: updatedProfile.updatedAt?.toISOString() || new Date().toISOString(),
    }
  }
}
