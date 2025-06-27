import { createRoute } from "@hono/zod-openapi";
import { errorResponses } from "../../../../utils/error/index.js";
import { upsertCoordReqSchema } from "../../application/users/upsert-coord-application.js";
import { deleteUserReqParamsSchema } from "../../dto/users/user-req.js";

export const upsertCoordRoute = createRoute({
  tags: ["users"],
  path: "/users/upsert-coord",
  method: "post",
  summary: "位置情報の更新",
  description: "ユーザーの位置情報を更新します",
  request: {
    body: {
      content: {
        "application/json": {
          schema: upsertCoordReqSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "成功",
    },
    ...errorResponses,
  },
});
