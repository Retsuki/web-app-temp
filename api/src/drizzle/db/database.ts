import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, "../../../.env") });

// biome-ignore lint/style/noNonNullAssertion: <explanation>
const client = postgres(process.env.DATABASE_URL!, { prepare: false });

export const db = drizzle(client, {
  schema,
  logger: false,
  casing: "snake_case",
});
export type Transaction = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];
