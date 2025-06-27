import type { App } from "../../_shared/factory/create-app.js";
import { validateUserId } from "../../_shared/utils/auth/index.js";


export const usersApi = (app: App) => {
  app.openapi(, async (c) => {
    const userId = validateUserId(c);
    const body = c.req.valid("json");
    const { upsertCoordApplication } = c.get("services");
    await upsertCoordApplication.execute(userId, body);
    return c.json(204);
  });


};
