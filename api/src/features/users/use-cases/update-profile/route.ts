import { createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { updateProfileReqSchema, userProfileResSchema } from "./dto.js";

export const updateProfileRoute = createRoute({
  method: "put",
  path: "/users/me",
  tags: ["users"],
  summary: "プロフィール更新",
  description: "認証済みユーザーの自分のプロフィール情報を更新します",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: updateProfileReqSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "プロフィール更新成功",
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
    400: {
      description: "バリデーションエラー",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
              details: z.any().optional(),
            }),
            metadata: z.object({
              timestamp: z.string().datetime(),
              version: z.string(),
            }),
          }),
        },
      },
    },
    401: {
      description: "認証エラー",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
            metadata: z.object({
              timestamp: z.string().datetime(),
              version: z.string(),
            }),
          }),
        },
      },
    },
    404: {
      description: "プロフィールが見つかりません",
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            error: z.object({
              code: z.string(),
              message: z.string(),
            }),
            metadata: z.object({
              timestamp: z.string().datetime(),
              version: z.string(),
            }),
          }),
        },
      },
    },
  },
});