import { and, eq } from 'drizzle-orm'
import { type Database, subscriptions } from '../../../drizzle/index.js'

export class SubscriptionRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string) {
    const [result] = await this.db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1)

    return result || null
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string) {
    const [result] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1)

    return result || null
  }

  async create(
    data: Omit<typeof subscriptions.$inferInsert, 'subscriptionId' | 'createdAt' | 'updatedAt'>
  ): Promise<typeof subscriptions.$inferSelect> {
    const [result] = await this.db
      .insert(subscriptions)
      .values({
        ...data,
        plan: data.plan as 'free' | 'indie' | 'pro',
        status: data.status as 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete',
        billingCycle: data.billingCycle as 'monthly' | 'yearly',
      })
      .returning()

    return result
  }

  async update(
    subscriptionId: string,
    data: Partial<
      Omit<typeof subscriptions.$inferInsert, 'subscriptionId' | 'createdAt' | 'updatedAt'>
    >
  ) {
    const [result] = await this.db
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, subscriptionId))
      .returning()

    return result || null
  }

  async updateByStripeSubscriptionId(
    stripeSubscriptionId: string,
    data: Partial<
      Omit<typeof subscriptions.$inferInsert, 'subscriptionId' | 'createdAt' | 'updatedAt'>
    >
  ) {
    const [result] = await this.db
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning()

    return result || null
  }
}
