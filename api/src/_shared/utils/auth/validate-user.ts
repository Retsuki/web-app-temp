// backend/src/utils/auth/validate-user.ts

import type { Context } from "hono";
import type { AppEnv } from "../../types/context.js";
import { AppHTTPException } from "../error/error-exception.js";
import { ERROR_CODES } from "../error/index.js";

/**
 * ユーザーIDを検証し、認証されていない場合は例外をスローする
 * @param c Honoのコンテキスト
 * @returns 検証済みのユーザーID
 */
export const validateUserId = (c: Context<AppEnv>): string => {
  const userId = c.get("userId");
  if (!userId) {
    throw new AppHTTPException(401, {
      message: "Unauthorized",
      code: ERROR_CODES.UNAUTHORIZED,
    });
  }
  return userId;
};
