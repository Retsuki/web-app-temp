import type { MiddlewareHandler } from "hono";
import { AppHTTPException, ERROR_CODES } from "../utils/error/index.js";

/**
 * Cloudflare Worker が付与する X-Edge-Auth を検証するミドルウェア
 */
export const edgeAuth: MiddlewareHandler = async (c, next) => {
  const token = c.req.header("x-edge-auth");
  if (token !== process.env.EDGE_AUTH_TOKEN) {
    throw new AppHTTPException(403, { code: ERROR_CODES.FORBIDDEN_OPERATION });
  }
  await next();
};
