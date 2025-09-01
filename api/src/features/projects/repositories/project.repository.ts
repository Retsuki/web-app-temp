import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import { sampleProjects as projects } from '../../../drizzle/db/apps/sample/index.js'
import type { Database } from '../../../drizzle/db/database.js'

export interface CreateProjectParams {
  userId: string
  name: string
  description?: string | null
  status?: string
  tags?: unknown[]
  metadata?: Record<string, unknown>
  startDate?: Date | null
  endDate?: Date | null
  priority?: number
  progress?: number
}

export interface UpdateProjectParams {
  name?: string
  description?: string | null
  status?: string
  tags?: unknown[]
  metadata?: Record<string, unknown>
  startDate?: Date | null
  endDate?: Date | null
  priority?: number
  progress?: number
}

export class ProjectRepository {
  constructor(private readonly db: Database) {}

  async findByUserId(userId: string) {
    return await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
      .orderBy(desc(projects.createdAt))
  }

  async findById(id: string, userId: string) {
    const results = await this.db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId), isNull(projects.deletedAt)))
      .limit(1)

    return results[0] || null
  }

  async create(params: CreateProjectParams) {
    const results = await this.db
      .insert(projects)
      .values({
        userId: params.userId,
        name: params.name,
        description: params.description,
        status: (params.status as 'active' | 'archived' | 'completed') || 'active',
        tags: params.tags || [],
        metadata: params.metadata || {},
        startDate: params.startDate,
        endDate: params.endDate,
        priority: params.priority || 0,
        progress: params.progress || 0,
      })
      .returning()

    return results[0]
  }

  async update(id: string, userId: string, params: UpdateProjectParams) {
    const { status, ...rest } = params
    const results = await this.db
      .update(projects)
      .set({
        ...rest,
        // status は 'active' | 'archived' | 'completed' を想定
        ...(status ? { status: status as 'active' | 'archived' | 'completed' } : {}),
        updatedAt: sql`now()`,
      })
      .where(and(eq(projects.id, id), eq(projects.userId, userId), isNull(projects.deletedAt)))
      .returning()

    return results[0] || null
  }

  async delete(id: string, userId: string) {
    const results = await this.db
      .update(projects)
      .set({
        deletedAt: sql`now()`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(projects.id, id), eq(projects.userId, userId), isNull(projects.deletedAt)))
      .returning()

    return results[0] || null
  }

  async countByUserId(userId: string) {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(projects)
      .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))

    return result[0]?.count || 0
  }
}
