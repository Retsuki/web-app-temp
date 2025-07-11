import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema.js'

// Lazy initialization to ensure environment variables are loaded
let dbInstance: ReturnType<typeof drizzle> | null = null
let clientInstance: ReturnType<typeof postgres> | null = null

export const getDb = () => {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    clientInstance = postgres(process.env.DATABASE_URL, { prepare: false })
    dbInstance = drizzle(clientInstance, {
      schema,
      logger: false,
      casing: 'snake_case',
    })
  }
  return dbInstance
}

// For backward compatibility
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  }
})

export type Transaction = Parameters<Parameters<(typeof db)['transaction']>[0]>[0]

export type Database = typeof db
