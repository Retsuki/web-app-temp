import { existsSync } from "node:fs";
import { config } from "dotenv";

// Load environment variables from mounted secret or .env file
if (existsSync("/etc/secrets/.env")) {
	config({ path: "/etc/secrets/.env" });
} else {
	config();
}

import { serve } from "@hono/node-server";
import { createApp } from "./_shared/factory/index.js";
import { authApi } from "./features/auth/index.js";
import { billingApi } from "./features/billing/index.js";
import { healthApi } from "./features/health/index.js";
import { projectsApi } from "./features/projects/index.js";
import { stripeWebhookApi } from "./features/stripe-webhook/index.js";
import { usersApi } from "./features/users/index.js";

const app = createApp();

// API routes
healthApi(app);
authApi(app);
usersApi(app);
projectsApi(app);
billingApi(app);
stripeWebhookApi(app);

const port = 8080;
serve(
	{
		fetch: app.fetch,
		port,
	},
	() => {
		console.log(`🚀 サーバーが起動しました！ポート: http://localhost:${port}`);
		console.log(`🚀 Swagger UI: http://localhost:${port}/api/v1/ui`);
	},
);
