import { AppHTTPException } from "../../../../_shared/utils/error/index.js";
import { ERROR_CODES } from "../../../../_shared/utils/error/index.js";
import type { UserRepository } from "../../repositories/user.repository.js";
import type { UserProfileRes } from "./dto.js";

export class GetUserProfileUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string): Promise<UserProfileRes> {
    // ユーザープロフィールを取得
    const profile = await this.userRepository.findByUserId(userId);

    if (!profile) {
      throw new AppHTTPException(404, {
        code: ERROR_CODES.PROFILE_NOT_FOUND,
        message: "プロフィールが見つかりません",
      });
    }

    // レスポンス形式に変換
    return {
      id: profile.id,
      userId: profile.userId,
      email: profile.email,
      nickname: profile.nickname,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      isPublic: profile.isPublic,
      createdAt: profile.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: profile.updatedAt?.toISOString() || new Date().toISOString(),
    };
  }
}