import { eq } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { profiles } from "../../../drizzle/db/schema.js";
import * as schema from "../../../drizzle/db/schema.js";

export type UserProfile = typeof profiles.$inferSelect;
export type CreateUserProfile = typeof profiles.$inferInsert;
export type UpdateUserProfile = Partial<Omit<CreateUserProfile, "id" | "userId" | "createdAt" | "updatedAt">>;

export class UserRepository {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  /**
   * ユーザーIDでプロフィールを取得
   */
  async findByUserId(userId: string): Promise<UserProfile | null> {
    const result = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1);
    
    return result[0] || null;
  }

  /**
   * プロフィールIDで取得（論理削除を考慮）
   */
  async findById(id: string): Promise<UserProfile | null> {
    const result = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.id, id))
      .limit(1);
    
    // 論理削除されていないレコードのみ返す
    if (result[0]?.deletedAt) {
      return null;
    }
    
    return result[0] || null;
  }

  /**
   * プロフィールを作成
   */
  async create(data: CreateUserProfile): Promise<UserProfile> {
    const result = await this.db
      .insert(profiles)
      .values(data)
      .returning();
    
    return result[0];
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
      .returning();
    
    return result[0];
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
      .where(eq(profiles.userId, userId));
  }

  /**
   * メールアドレスの重複チェック
   */
  async isEmailExists(email: string, excludeUserId?: string): Promise<boolean> {
    const result = await this.db
      .select({ count: profiles.id })
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    
    if (result.length === 0) {
      return false;
    }
    
    // 除外するユーザーIDが指定されている場合
    if (excludeUserId && result[0]) {
      const profile = await this.db
        .select()
        .from(profiles)
        .where(eq(profiles.email, email))
        .limit(1);
      
      // 同じユーザーIDなら重複とはみなさない
      if (profile[0]?.userId === excludeUserId) {
        return false;
      }
    }
    
    // 論理削除されているレコードは重複とみなさない
    const profile = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.email, email))
      .limit(1);
    
    if (profile[0]?.deletedAt) {
      return false;
    }
    
    return true;
  }
}