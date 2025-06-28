import { z } from "@hono/zod-openapi";
import { userProfileResSchema } from "../get-profile/dto.js";

/**
 * プロフィール更新リクエストスキーマ
 */
export const updateProfileReqSchema = z.object({
  nickname: z.string().min(1).max(50).optional().openapi({
    description: "ニックネーム",
    example: "たろう",
  }),
  avatarUrl: z.string().url().nullable().optional().openapi({
    description: "アバター画像URL",
    example: "https://example.com/avatar.jpg",
  }),
  bio: z.string().max(500).nullable().optional().openapi({
    description: "自己紹介",
    example: "よろしくお願いします",
  }),
  isPublic: z.boolean().optional().openapi({
    description: "プロフィール公開設定",
    example: true,
  }),
}).openapi("UpdateProfileRequest");

export type UpdateProfileReq = z.infer<typeof updateProfileReqSchema>;

// レスポンスは get-profile と同じものを使用
export { userProfileResSchema, type UserProfileRes } from "../get-profile/dto.js";