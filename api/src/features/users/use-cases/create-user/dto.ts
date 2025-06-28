import { z } from "@hono/zod-openapi";

export const createUserRequestSchema = z
  .object({
    userId: z.string().uuid().describe("Supabase AuthのユーザーID"),
    email: z.string().email().describe("メールアドレス"),
    nickname: z.string().min(1).max(50).describe("ニックネーム"),
  })
  .openapi("CreateUserRequest");

export const createUserResponseSchema = z
  .object({
    id: z.string().uuid().describe("プロフィールID"),
    userId: z.string().uuid().describe("ユーザーID"),
    email: z.string().email().describe("メールアドレス"),
    nickname: z.string().describe("ニックネーム"),
    createdAt: z.string().datetime().describe("作成日時"),
    updatedAt: z.string().datetime().describe("更新日時"),
  })
  .openapi("CreateUserResponse");

export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type CreateUserResponse = z.infer<typeof createUserResponseSchema>;