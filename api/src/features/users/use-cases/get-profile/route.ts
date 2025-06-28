import { createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { errorResponses } from "../../../../_shared/utils/error/index.js";
import { userProfileResSchema } from "./dto.js";

export const getProfileRoute = createRoute({
  method: "get",
  path: "/users/me",
  tags: ["users"],
  summary: "自分のプロフィール取得",
  description: "認証済みユーザーの自分のプロフィール情報を取得します",
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      description: "プロフィール取得成功",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            data: userProfileResSchema,
            metadata: z.object({
              timestamp: z.string().datetime(),
              version: z.string(),
            }),
          }),
        },
      },
    },
    ...errorResponses,
  },
});