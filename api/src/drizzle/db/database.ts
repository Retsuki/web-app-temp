import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as sampleSchema from './apps/sample/index.js'
import * as baseSchema from './schema.js'

// Combine main schema with sample app schema for typed access
const schema = { ...baseSchema, ...sampleSchema } as const

// Lazy initialization to ensure environment variables are loaded
let dbInstance: ReturnType<typeof drizzle> | null = null
let clientInstance: ReturnType<typeof postgres> | null = null

export const getDb = () => {
  if (!dbInstance) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    clientInstance = postgres(process.env.DATABASE_URL, {
      prepare: false,
      max: 20, // 最大接続数を増やす
      idle_timeout: 20, // アイドルタイムアウト
      connect_timeout: 10, // 接続タイムアウトを10秒に設定
    })
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
  get(_target, prop, receiver) {
    return Reflect.get(getDb(), prop, receiver)
  },
})

export type Transaction = Parameters<Parameters<(typeof db)['transaction']>[0]>[0]

export type Database = typeof db
