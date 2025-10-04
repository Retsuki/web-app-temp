import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type { profiles } from './schema.js'

// Profiles
export type SelectProfile = InferSelectModel<typeof profiles>
export type InsertProfile = InferInsertModel<typeof profiles>
export type UpdateProfile = Partial<InsertProfile> & { id: string }
