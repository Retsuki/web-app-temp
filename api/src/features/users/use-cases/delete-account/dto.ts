import { z } from "@hono/zod-openapi";

/**
 * アカウント削除リクエストスキーマ
 */
export const deleteAccountReqSchema = z.object({
  confirmation: z.literal("DELETE_MY_ACCOUNT").openapi({
    description: "削除確認文字列（DELETE_MY_ACCOUNTと入力）",
    example: "DELETE_MY_ACCOUNT",
  }),
}).openapi("DeleteAccountRequest");

export type DeleteAccountReq = z.infer<typeof deleteAccountReqSchema>;