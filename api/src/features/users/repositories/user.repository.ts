import type { Database } from '@app/drizzle/index.js'
import { eq, profiles } from '@app/drizzle/index.js'

export type UserProfile = typeof profiles.$inferSelect
export type CreateUserProfile = typeof profiles.$inferInsert
export type UpdateUserProfile = Partial<Omit<CreateUserProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>

export class UserRepository {
  constructor(private db: Database) {}

  /**
   * ユーザーIDでプロフィールを取得
   */
  async findById(userId: string): Promise<UserProfile | null> {
    const result = await this.db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)

    return result[0] || null
  }

  /**
   * ユーザーIDでプロフィールを取得
   */
  async findByUserId(userId: string): Promise<UserProfile | null> {
    const result = await this.db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1)

    return result[0] || null
  }

  /**
   * プロフィールを作成
   */
  async create(data: CreateUserProfile): Promise<UserProfile> {
    const result = await this.db.insert(profiles).values(data).returning()

    return result[0]
  }

  /**
   * プロフィールを更新
   */
  async update(userId: string, data: UpdateUserProfile): Promise<UserProfile> {
    const result = await this.db
      .update(profiles)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning()

    return result[0]
  }

  /**
   * プロフィールを論理削除
   */
  async softDelete(userId: string): Promise<void> {
    await this.db
      .update(profiles)
      .set({
        deletedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
  }

  /**
   * メールアドレスの重複チェック
   */
  async isEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const result = await this.db.select({ count: profiles.id }).from(profiles).where(eq(profiles.email, email)).limit(1)

    if (result.length === 0) {
      return false
    }

    // 除外するユーザーIDが指定されている場合
    if (excludeUserId && result[0]) {
      const profile = await this.db.select().from(profiles).where(eq(profiles.email, email)).limit(1)

      // 同じユーザーIDなら重複とはみなさない
      if (profile[0]?.userId === excludeUserId) {
        return false
      }
    }

    // 論理削除されているレコードは重複とみなさない
    const profile = await this.db.select().from(profiles).where(eq(profiles.email, email)).limit(1)

    if (profile[0]?.deletedAt) {
      return false
    }

    return true
  }

  // Stripe Customer ID の管理は billing_customers テーブルに移行
}
