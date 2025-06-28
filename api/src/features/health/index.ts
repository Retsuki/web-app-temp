import { createRoute } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";
import type { App } from "../../_shared/factory/create-app.js";

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["system"],
  summary: "ヘルスチェック",
  description: "APIサーバーの稼働状況を確認します",
  responses: {
    200: {
      description: "サーバー正常稼働中",
      content: {
        "application/json": {
          schema: z.object({
            status: z.literal("ok"),
            timestamp: z.string().datetime(),
            version: z.string(),
            uptime: z.number(),
          }),
        },
      },
    },
  },
});

const startTime = Date.now();

export const healthApi = (app: App) => {
  app.openapi(healthRoute, async (c) => {
    const uptime = Math.floor((Date.now() - startTime) / 1000);
    
    return c.json({
      status: "ok" as const,
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime,
    });
  });
};