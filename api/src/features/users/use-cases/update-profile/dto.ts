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
}).openapi("UpdateProfileRequest");

export type UpdateProfileReq = z.infer<typeof updateProfileReqSchema>;

// レスポンスは get-profile と同じものを使用
export { userProfileResSchema, type UserProfileRes } from "../get-profile/dto.js";