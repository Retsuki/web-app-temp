// src/utils/error/error-code.ts

// エラーコードのマッピングを as const で定義
export const ERROR_CODES = {
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN_OPERATION: "FORBIDDEN_OPERATION",
  NOT_FOUND: "NOT_FOUND",
  INVALID_TOKEN: "INVALID_TOKEN",
  INVALID_TYPE: "INVALID_TYPE",
  INVALID_REQUEST: "INVALID_REQUEST",

  CONFLICT: "CONFLICT",
  PROFILE_NOT_FOUND: "PROFILE_NOT_FOUND",
} as const;

// typeof ERROR_CODES からキーの型を抜き出す
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
