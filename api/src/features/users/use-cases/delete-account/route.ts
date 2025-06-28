import { createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import { deleteAccountReqSchema } from "./dto.js";

export const deleteAccountRoute = createRoute({
  method: "delete",
  path: "/users/me",
  tags: ["users"],
  summary: "アカウント削除",
  description: "認証済みユーザーのアカウントを論理削除します。この操作は取り消せません。",
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        "application/json": {
          schema: deleteAccountReqSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "アカウント削除成功",
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