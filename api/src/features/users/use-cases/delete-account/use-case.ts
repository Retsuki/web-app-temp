import type { UserRepository } from "../../repositories/user.repository.js";
import type { DeleteAccountReq } from "./dto.js";

export class DeleteUserAccountUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(userId: string, data: DeleteAccountReq): Promise<void> {
    // 確認文字列のチェック
    if (data.confirmation !== "DELETE_MY_ACCOUNT") {
      throw new Error("INVALID_CONFIRMATION");
    }

    // プロフィールの存在確認
    const existingProfile = await this.userRepository.findByUserId(userId);
    if (!existingProfile) {
      throw new Error("PROFILE_NOT_FOUND");
    }

    // アカウントを論理削除
    await this.userRepository.softDelete(userId);

    // TODO: 将来的には以下の処理も追加
    // - Supabase Authからユーザーを削除
    // - 関連データの削除または匿名化
    // - 削除通知メールの送信
  }
}