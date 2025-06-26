// src/utils/error/error-schema.ts

import { z } from "@hono/zod-openapi";
import type { StatusCode } from "hono/utils/http-status";
import { ERROR_CODES, type ErrorCode } from "./error-code.js";

const createErrorSchema = (code: ErrorCode, statusCode: StatusCode) => {
	return z.object({
		error: z.object({
			code: z.nativeEnum(ERROR_CODES).openapi({
				description: "エラーコード",
				example: code,
			}),
			message: z.string().openapi({ description: "エラーの説明メッセージ" }),
			requestId: z.string().openapi({
				description: "リクエストID",
				example: "req_1234",
			}),
			statusCode: z.number().int().openapi({
				description: "HTTPステータスコード",
				example: statusCode,
			}),
		}),
	});
};

export const errorResponseSchema = createErrorSchema(
	ERROR_CODES.UNKNOWN_ERROR,
	500,
);

export const errorResponses = {
	400: {
		description:
			"クライアントからのリクエストに問題があり、サーバーが処理を完了できませんでした。",
		content: {
			"application/json": {
				schema: createErrorSchema(ERROR_CODES.INVALID_TOKEN, 400).openapi(
					"ErrBadRequest",
				),
			},
		},
	},
	401: {
		description:
			"認証が必要です。アクセストークンが無効か期限切れの可能性があります。",
		content: {
			"application/json": {
				schema: createErrorSchema(ERROR_CODES.UNAUTHORIZED, 401).openapi(
					"ErrUnauthorized",
				),
			},
		},
	},
	403: {
		description: "この操作を実行する権限がありません。",
		content: {
			"application/json": {
				schema: createErrorSchema(ERROR_CODES.FORBIDDEN_OPERATION, 403).openapi(
					"ErrForbidden",
				),
			},
		},
	},
	404: {
		description: "リクエストされたリソースが見つかりませんでした。",
		content: {
			"application/json": {
				schema: createErrorSchema(ERROR_CODES.NOT_FOUND, 404).openapi(
					"ErrNotFound",
				),
			},
		},
	},
	422: {
		description: "年齢確認に失敗しました。",
		content: {
			"application/json": {
				schema: createErrorSchema(
					ERROR_CODES.AGE_VERIFICATION_FAILED,
					422,
				).openapi("ErrAgeVerification"),
			},
		},
	},
	500: {
		description: "サーバー内部でエラーが発生しました。",
		content: {
			"application/json": {
				schema: createErrorSchema(ERROR_CODES.UNKNOWN_ERROR, 500).openapi(
					"ErrInternalServer",
				),
			},
		},
	},
};
