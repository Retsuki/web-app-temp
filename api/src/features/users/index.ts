import type { App } from "../../_shared/factory/create-app.js";
import { validateUserId } from "../../_shared/utils/auth/index.js";
import { db } from "../../drizzle/db/database.js";
import { UserRepository } from "./repositories/user.repository.js";
import { getProfileRoute } from "./use-cases/get-profile/route.js";
import { GetUserProfileUseCase } from "./use-cases/get-profile/use-case.js";
import { updateProfileRoute } from "./use-cases/update-profile/route.js";
import { UpdateUserProfileUseCase } from "./use-cases/update-profile/use-case.js";
import { deleteAccountRoute } from "./use-cases/delete-account/route.js";
import { DeleteUserAccountUseCase } from "./use-cases/delete-account/use-case.js";

export const usersApi = (app: App) => {
  // GET /users/me - プロフィール取得
  app.openapi(getProfileRoute, async (c) => {
    const userId = validateUserId(c);
    
    const userRepository = new UserRepository(db);
    const getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
    
    try {
      const profile = await getUserProfileUseCase.execute(userId);
      return c.json({
        success: true,
        data: profile,
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
        },
      }, 200);
    } catch (error: any) {
      if (error.message === "PROFILE_NOT_FOUND") {
        return c.json({
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "プロフィールが見つかりません",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          },
        }, 404);
      }
      throw error;
    }
  });

  // PUT /users/me - プロフィール更新
  app.openapi(updateProfileRoute, async (c) => {
    const userId = validateUserId(c);
    const body = c.req.valid("json");
    
    const userRepository = new UserRepository(db);
    const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
    
    try {
      const profile = await updateUserProfileUseCase.execute(userId, body);
      return c.json({
        success: true,
        data: profile,
        metadata: {
          timestamp: new Date().toISOString(),
          version: "1.0.0",
        },
      }, 200);
    } catch (error: any) {
      if (error.message === "PROFILE_NOT_FOUND") {
        return c.json({
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "プロフィールが見つかりません",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          },
        }, 404);
      }
      throw error;
    }
  });

  // DELETE /users/me - アカウント削除
  app.openapi(deleteAccountRoute, async (c) => {
    const userId = validateUserId(c);
    const body = c.req.valid("json");
    
    const userRepository = new UserRepository(db);
    const deleteUserAccountUseCase = new DeleteUserAccountUseCase(userRepository);
    
    try {
      await deleteUserAccountUseCase.execute(userId, body);
      return c.body(null, 204);
    } catch (error: any) {
      if (error.message === "PROFILE_NOT_FOUND") {
        return c.json({
          success: false,
          error: {
            code: "PROFILE_NOT_FOUND",
            message: "プロフィールが見つかりません",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          },
        }, 404);
      }
      if (error.message === "INVALID_CONFIRMATION") {
        return c.json({
          success: false,
          error: {
            code: "INVALID_CONFIRMATION",
            message: "確認文字列が正しくありません",
          },
          metadata: {
            timestamp: new Date().toISOString(),
            version: "1.0.0",
          },
        }, 400);
      }
      throw error;
    }
  });
};
