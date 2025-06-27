import { serve } from "@hono/node-server";
import { createApp } from "./_shared/factory/create-app.js";

const app = createApp();

const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    console.log(`🚀 サーバーが起動しました！ポート: http://localhost:${port}`);
    console.log(`🚀 Swagger UI: http://localhost:${port}/api/v1/ui`);
  }
);
