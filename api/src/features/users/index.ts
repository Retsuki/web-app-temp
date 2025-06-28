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
    
    const profile = await getUserProfileUseCase.execute(userId);
    
    return c.json({
      success: true,
      data: profile,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    }, 200);
  });

  // PUT /users/me - プロフィール更新
  app.openapi(updateProfileRoute, async (c) => {
    const userId = validateUserId(c);
    const body = c.req.valid("json");
    
    const userRepository = new UserRepository(db);
    const updateUserProfileUseCase = new UpdateUserProfileUseCase(userRepository);
    
    const profile = await updateUserProfileUseCase.execute(userId, body);
    
    return c.json({
      success: true,
      data: profile,
      metadata: {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
      },
    }, 200);
  });

  // DELETE /users/me - アカウント削除
  app.openapi(deleteAccountRoute, async (c) => {
    const userId = validateUserId(c);
    const body = c.req.valid("json");
    
    const userRepository = new UserRepository(db);
    const deleteUserAccountUseCase = new DeleteUserAccountUseCase(userRepository);
    
    await deleteUserAccountUseCase.execute(userId, body);
    
    return c.body(null, 204);
  });
};
