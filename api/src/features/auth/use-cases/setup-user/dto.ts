import { z } from '@hono/zod-openapi'

// リクエストスキーマ
export const setupUserRequestSchema = z.object({
  userId: z.string().uuid().describe('Supabase Auth のユーザーID'),
  email: z.string().email().describe('メールアドレス'),
  nickname: z.string().min(1).max(50).describe('ニックネーム'),
  language: z.string().default('ja').describe('言語設定'),
})

// レスポンススキーマ
export const setupUserResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    profileId: z.string().uuid(),
    projectId: z.string().uuid(),
    redirectTo: z.string().describe('リダイレクト先URL'),
  }),
  metadata: z.object({
    timestamp: z.string(),
    version: z.string(),
  }),
})

export type SetupUserRequest = z.infer<typeof setupUserRequestSchema>
export type SetupUserResponse = z.infer<typeof setupUserResponseSchema>