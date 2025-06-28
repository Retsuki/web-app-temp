import { createRoute } from "@hono/zod-openapi";
import { errorResponses } from "../../../../_shared/utils/error/index.js";
import { createUserRequestSchema, createUserResponseSchema } from "./dto.js";

export const createUserRoute = createRoute({
  method: "post",
  path: "/users",
  tags: ["users"],
  summary: "ユーザープロフィールを作成",
  description: "新規ユーザーのプロフィールを作成します",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createUserRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "ユーザープロフィール作成成功",
      content: {
        "application/json": {
          schema: createUserResponseSchema,
        },
      },
    },
    ...errorResponses,
  },
});
