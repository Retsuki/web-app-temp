import type { Database } from '../../../drizzle/index.js'
import { billingCustomers, eq, plans } from '../../../drizzle/index.js'

export class BillingCustomerRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string) {
    const [result] = await this.db.select().from(billingCustomers).where(eq(billingCustomers.userId, userId)).limit(1)

    return result || null
  }

  async create(userId: string, stripeCustomerId: string) {
    // default to free plan
    const [freePlan] = await this.db.select().from(plans).where(eq(plans.slug, 'free')).limit(1)
    const [result] = await this.db
      .insert(billingCustomers)
      .values({ userId, stripeCustomerId, planId: freePlan?.id as string })
      .returning()

    return result
  }
}
