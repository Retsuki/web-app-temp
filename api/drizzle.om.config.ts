import * as dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config({ path: '../.env' })

export default defineConfig({
  schema: './src/drizzle/db/apps/om/schema/drizzle-kit.ts',
  out: './src/drizzle/migrations/om',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
  },
  verbose: true,
  strict: false,
})

