import { createRoute } from "@hono/zod-openapi";
import { getPlansRes } from "./res.js";

export const getPlansRoute = createRoute({
	method: "get",
	path: "/plans",
	operationId: "getPlans",
	tags: ["billing"],
	summary: "Get available plans",
	description: "Get list of available subscription plans",
	responses: {
		200: {
			content: {
				"application/json": {
					schema: getPlansRes,
				},
			},
			description: "List of available plans",
		},
	},
});
