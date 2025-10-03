import type { Database } from '../../../drizzle/index.js'
import { eq, plans } from '../../../drizzle/index.js'

export interface PlanRowDto {
  id: string
  plan: 'free' | 'starter' | 'pro'
  name?: string
  description?: string
  displayOrder: number
  createdAt?: Date
  updatedAt?: Date
}

export class PlansRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<PlanRowDto[]> {
    const rows = await this.db.select().from(plans).orderBy(plans.displayOrder)
    type PlanTable = typeof plans.$inferSelect
    return rows.map((row: PlanTable) => ({
      id: row.id,
      plan: row.slug as 'free' | 'starter' | 'pro',
      name: row.name || undefined,
      description: row.description || undefined,
      displayOrder: row.displayOrder,
      createdAt: row.createdAt || undefined,
      updatedAt: row.updatedAt || undefined,
    }))
  }

  async findByPlan(plan: 'free' | 'starter' | 'pro'): Promise<PlanRowDto | null> {
    const [result] = await this.db.select().from(plans).where(eq(plans.slug, plan)).limit(1)

    if (!result) {
      return null
    }

    return {
      id: result.id,
      plan: result.slug as 'free' | 'starter' | 'pro',
      name: result.name || undefined,
      description: result.description || undefined,
      displayOrder: result.displayOrder,
      createdAt: result.createdAt || undefined,
      updatedAt: result.updatedAt || undefined,
    }
  }
}
