import type { Database } from "@app/drizzle/db/index.js"
import { eq, pmtProjects, profiles } from "@app/drizzle/db/index.js"
import { AppHTTPException } from "../../../_shared/utils/error/error-exception.js"
import { ERROR_CODES } from "../../../_shared/utils/error/index.js"

export class AuthRepository {
  constructor(private readonly db: Database) {}

  async findProfileByUserId(userId: string) {
    const result = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.userId, userId))
      .limit(1)

    // プロジェクトも取得
    if (result[0]) {
      const userProjects = await this.db
        .select()
        .from(pmtProjects)
        .where(eq(pmtProjects.ownerId, userId))
        .orderBy(pmtProjects.createdAt)

      return {
        ...result[0],
        projects: userProjects,
      }
    }

    return null
  }

  async createProfile(data: {
    userId: string
    email: string
    nickname: string
    language: string
  }) {
    // メールアドレスの重複チェック
    const existingEmail = await this.db
      .select()
      .from(profiles)
      .where(eq(profiles.email, data.email))
      .limit(1)

    if (existingEmail.length > 0) {
      throw new AppHTTPException(409, {
        code: ERROR_CODES.CONFLICT,
        message: "このメールアドレスは既に使用されています",
      })
    }

    const [profile] = await this.db
      .insert(profiles)
      .values({
        userId: data.userId,
        email: data.email,
        nickname: data.nickname,
        language: data.language,
      })
      .returning()

    if (!profile) {
      throw new AppHTTPException(500, {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: "プロフィール作成に失敗しました",
      })
    }

    return profile
  }

  async createInitialProject(data: { name: string; ownerId: string }) {
    const [project] = await this.db
      .insert(pmtProjects)
      .values({
        name: data.name,
        ownerId: data.ownerId,
        status: "draft",
        isSetupComplete: false,
      })
      .returning()

    if (!project) {
      throw new AppHTTPException(500, {
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
        message: "プロジェクト作成に失敗しました",
      })
    }

    return project
  }
}
