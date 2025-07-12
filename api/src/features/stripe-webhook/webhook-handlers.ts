import { eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import { logger } from '../../_shared/utils/logger.js'
import {
  type Database,
  paymentHistory,
  profiles,
  subscriptions,
  webhookEvents,
} from '../../drizzle/index.js'

export class WebhookHandlers {
  constructor(private db: Database) {}

  async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    logger.info({ subscriptionId: subscription.id }, 'Handling subscription created')

    const metadata = subscription.metadata
    const userId = metadata.userId
    const planId = metadata.planId as 'indie' | 'pro'
    const billingCycle = metadata.billingCycle as 'monthly' | 'yearly'

    // Insert subscription record
    await this.db.insert(subscriptions).values({
      userId,
      stripeSubscriptionId: subscription.id,
      stripePriceId: subscription.items.data[0].price.id,
      stripeProductId: subscription.items.data[0].price.product as string,
      plan: planId,
      status: subscription.status,
      billingCycle,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    })

    // Update user profile
    await this.db
      .update(profiles)
      .set({
        plan: planId,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    logger.info({ subscriptionId: subscription.id }, 'Handling subscription updated')

    // Update subscription record
    await this.db
      .update(subscriptions)
      .set({
        status: subscription.status,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
  }

  async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    logger.info({ subscriptionId: subscription.id }, 'Handling subscription deleted')

    // Get subscription to find userId
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))
      .limit(1)

    if (!sub) {
      logger.warn({ subscriptionId: subscription.id }, 'Subscription not found')
      return
    }

    // Update subscription status
    await this.db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))

    // Update user to free plan
    await this.db
      .update(profiles)
      .set({
        plan: 'free',
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, sub.userId))
  }

  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    logger.info({ invoiceId: invoice.id }, 'Handling invoice payment succeeded')

    const subscription = invoice.subscription as string

    // Get user ID from subscription
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription))
      .limit(1)

    if (!sub) {
      logger.warn({ subscriptionId: subscription }, 'Subscription not found for invoice')
      return
    }

    // Record payment
    await this.db.insert(paymentHistory).values({
      userId: sub.userId,
      subscriptionId: sub.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent ? String(invoice.payment_intent) : null,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      description: `${sub.plan} plan - ${sub.billingCycle} billing`,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      paidAt: new Date(),
    })

    // Reset monthly usage if needed
    if (sub.billingCycle === 'monthly') {
      await this.db
        .update(profiles)
        .set({
          monthlyUsageCount: 0,
          usageResetAt: new Date(invoice.period_end * 1000),
          updatedAt: new Date(),
        })
        .where(eq(profiles.userId, sub.userId))
    }
  }

  async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    logger.info({ invoiceId: invoice.id }, 'Handling invoice payment failed')

    const subscription = invoice.subscription as string

    // Update subscription status
    await this.db
      .update(subscriptions)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription))

    // Record failed payment
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscription))
      .limit(1)

    if (sub) {
      await this.db.insert(paymentHistory).values({
        userId: sub.userId,
        subscriptionId: sub.id,
        stripeInvoiceId: invoice.id,
        stripePaymentIntentId: invoice.payment_intent ? String(invoice.payment_intent) : null,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed',
        description: `Payment failed for ${sub.plan} plan`,
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      })
    }
  }

  async recordWebhookEvent(event: Stripe.Event) {
    await this.db.insert(webhookEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      apiVersion: event.api_version || null,
      payload: event,
      objectId: ('id' in event.data.object && typeof event.data.object.id === 'string' ? event.data.object.id : null),
      objectType: event.data.object.object || null,
      status: 'processed',
      processedAt: new Date(),
      eventCreatedAt: new Date(event.created * 1000),
    })
  }
}
