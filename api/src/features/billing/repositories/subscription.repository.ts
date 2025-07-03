import type { Database } from '@/drizzle/db/database.js'
import { subscriptions } from '@/drizzle/db/schema.js'
import { eq, and } from 'drizzle-orm'
import type { PlanId, BillingCycle } from '@/constants/plans.js'

export interface Subscription {
  subscriptionId: string
  userId: string
  stripeSubscriptionId: string
  stripeCustomerId: string
  stripePriceId: string
  plan: PlanId
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete'
  billingCycle: BillingCycle
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAt: Date | null
  canceledAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class SubscriptionRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string): Promise<Subscription | null> {
    const result = await this.db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.userId, userId),
          eq(subscriptions.status, 'active')
        )
      )
      .limit(1)

    return result[0] || null
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const result = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1)

    return result[0] || null
  }

  async create(data: Omit<Subscription, 'subscriptionId' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
    const result = await this.db
      .insert(subscriptions)
      .values({
        ...data,
        plan: data.plan as 'free' | 'indie' | 'pro',
        status: data.status as 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete',
        billingCycle: data.billingCycle as 'monthly' | 'yearly',
      })
      .returning()

    return result[0]
  }

  async update(
    subscriptionId: string,
    data: Partial<Omit<Subscription, 'subscriptionId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Subscription | null> {
    const result = await this.db
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.subscriptionId, subscriptionId))
      .returning()

    return result[0] || null
  }

  async updateByStripeSubscriptionId(
    stripeSubscriptionId: string,
    data: Partial<Omit<Subscription, 'subscriptionId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Subscription | null> {
    const result = await this.db
      .update(subscriptions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .returning()

    return result[0] || null
  }
}