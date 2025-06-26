import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import type {
	AppContextVariables,
	SupabaseJWTPayload,
} from "../types/context.js";
import { AppHTTPException, ERROR_CODES } from "../utils/error/index.js";

/**
 * 認証ミドルウェア
 * CookieまたはAuthorizationヘッダーからトークンを取得して検証する
 */
export const authMiddleware: MiddlewareHandler<{
	Variables: AppContextVariables;
}> = async (c, next) => {
	// Cookieからトークンを取得
	let token = getCookie(c, "token");

	// CookieにトークンがなければAuthorizationヘッダーから取得
	if (!token) {
		const authHeader = c.req.header("Authorization");
		if (authHeader?.startsWith("Bearer ")) {
			token = authHeader.substring(7); // "Bearer "を除去
		}
	}

	// トークンが見つからなかった場合は401エラーを返す
	if (!token) {
		throw new AppHTTPException(401, { code: ERROR_CODES.UNAUTHORIZED });
	}

	try {
		const payload = (await verify(
			token,
			process.env.JWT_SECRET ?? "",
		)) as SupabaseJWTPayload;

		c.set("payload", payload);
		c.set("userId", payload.sub);

		await next();
	} catch (error) {
		throw new AppHTTPException(401, { code: ERROR_CODES.INVALID_TOKEN });
	}
};
