import type { Database } from "@app/drizzle/db/index.js"
import { billingCustomers, eq } from "@app/drizzle/db/index.js"

export class BillingCustomerRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string) {
    const [result] = await this.db
      .select()
      .from(billingCustomers)
      .where(eq(billingCustomers.userId, userId))
      .limit(1)

    return result || null
  }

  async create(userId: string, stripeCustomerId: string) {
    const [result] = await this.db
      .insert(billingCustomers)
      .values({ userId, stripeCustomerId })
      .returning()

    return result
  }
}

