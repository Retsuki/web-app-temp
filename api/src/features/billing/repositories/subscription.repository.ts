import type { Database } from '../../../drizzle/index.js'
import { and, eq, subscriptions, plans } from '../../../drizzle/index.js'

export class SubscriptionRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string) {
    const [result] = await this.db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        stripePriceId: subscriptions.stripePriceId,
        stripeProductId: subscriptions.stripeProductId,
        planId: subscriptions.planId,
        planSlug: plans.slug,
        status: subscriptions.status,
        billingCycle: subscriptions.billingCycle,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAt: subscriptions.cancelAt,
        canceledAt: subscriptions.canceledAt,
        cancelReason: subscriptions.cancelReason,
        trialStart: subscriptions.trialStart,
        trialEnd: subscriptions.trialEnd,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
      })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.planId, plans.id))
      .where(and(eq(subscriptions.userId, userId), eq(subscriptions.status, 'active')))
      .limit(1)

    return result || null
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string) {
    const [result] = await this.db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        stripeSubscriptionId: subscriptions.stripeSubscriptionId,
        stripePriceId: subscriptions.stripePriceId,
        stripeProductId: subscriptions.stripeProductId,
        planId: subscriptions.planId,
        planSlug: plans.slug,
        status: subscriptions.status,
        billingCycle: subscriptions.billingCycle,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAt: subscriptions.cancelAt,
        canceledAt: subscriptions.canceledAt,
        cancelReason: subscriptions.cancelReason,
        trialStart: subscriptions.trialStart,
        trialEnd: subscriptions.trialEnd,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,
      })
      .from(subscriptions)
      .leftJoin(plans, eq(subscriptions.planId, plans.id))
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1)

    return result || null
  }

  async create(
    data: Omit<typeof subscriptions.$inferInsert, 'subscriptionId' | 'createdAt' | 'updatedAt'>,
  ): Promise<typeof subscriptions.$inferSelect> {
    const [result] = await this.db
      .insert(subscriptions)
      .values({
        ...data,
        status: data.status,
        billingCycle: data.billingCycle,
      })
      .returning()

    return result
  }

  async update(
    subscriptionId: string,
    data: Partial<Omit<typeof subscriptions.$inferInsert, 'subscriptionId' | 'createdAt' | 'updatedAt'>>,
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
    data: Partial<Omit<typeof subscriptions.$inferInsert, 'subscriptionId' | 'createdAt' | 'updatedAt'>>,
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
