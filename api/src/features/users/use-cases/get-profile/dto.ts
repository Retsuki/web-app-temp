import { z } from "@hono/zod-openapi";

/**
 * プロフィールレスポンススキーマ
 */
export const userProfileResSchema = z.object({
  id: z.string().uuid().openapi({
    description: "プロフィールID",
    example: "123e4567-e89b-12d3-a456-426614174000",
  }),
  userId: z.string().uuid().openapi({
    description: "ユーザーID",
    example: "123e4567-e89b-12d3-a456-426614174001",
  }),
  email: z.string().email().openapi({
    description: "メールアドレス",
    example: "user@example.com",
  }),
  nickname: z.string().openapi({
    description: "ニックネーム",
    example: "たろう",
  }),
  createdAt: z.string().datetime().openapi({
    description: "作成日時",
    example: "2024-01-01T00:00:00Z",
  }),
  updatedAt: z.string().datetime().openapi({
    description: "更新日時",
    example: "2024-01-01T00:00:00Z",
  }),
}).openapi("UserProfile");

export type UserProfileRes = z.infer<typeof userProfileResSchema>;