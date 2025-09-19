import type Stripe from 'stripe'
import { logger } from '../../_shared/utils/logger.js'
import { type Database, eq, paymentHistory, profiles, subscriptions, webhookEvents } from '../../drizzle/index.js'

export class WebhookHandlers {
  constructor(private db: Database) {}

  private mapStripeStatus(status: Stripe.Subscription.Status): 'active' | 'past_due' | 'canceled' | 'unpaid' {
    switch (status) {
      case 'active':
      case 'trialing':
      case 'incomplete':
      case 'incomplete_expired':
        return 'active'
      case 'past_due':
        return 'past_due'
      case 'canceled':
        return 'canceled'
      case 'unpaid':
        return 'unpaid'
      default:
        return 'active'
    }
  }

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
      status: this.mapStripeStatus(subscription.status),
      billingCycle,
      currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    })

    // profiles にプランカラムはないため更新不要
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    logger.info({ subscriptionId: subscription.id }, 'Handling subscription updated')

    // Update subscription record
    await this.db
      .update(subscriptions)
      .set({
        status: this.mapStripeStatus(subscription.status),
        currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
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

    // profiles にプランカラムはないため更新不要
  }

  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    logger.info({ invoiceId: invoice.id }, 'Handling invoice payment succeeded')

    const invoiceId = invoice.id
    if (!invoiceId) {
      logger.warn({ invoiceId }, 'No invoice ID found')
      return
    }

    // Get subscription ID from parent.subscription_details.subscription
    const subscriptionIdOrObject = invoice.parent?.subscription_details?.subscription

    if (!subscriptionIdOrObject) {
      logger.warn({ invoiceId: invoice.id }, 'No subscription ID found in invoice')
      return
    }

    // Extract subscription ID (it might be a string or an object)
    const subscriptionId =
      typeof subscriptionIdOrObject === 'string' ? subscriptionIdOrObject : subscriptionIdOrObject.id

    // Get user ID from subscription
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1)

    if (!sub) {
      logger.warn({ subscriptionId }, 'Subscription not found for invoice')
      return
    }

    // Get payment intent ID from payments data if available
    const paymentIntent = invoice.payments?.data?.[0]?.payment?.payment_intent
    const paymentIntentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id || null

    // Record payment
    const paymentData = {
      userId: sub.userId,
      subscriptionId: sub.id,
      stripeInvoiceId: invoiceId,
      stripePaymentIntentId: paymentIntentId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'paid' as const,
      description: `${sub.plan} plan - ${sub.billingCycle} billing`,
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      paidAt: new Date(),
    }

    await this.db.insert(paymentHistory).values(paymentData)

    // 注: profiles テーブルに使用量カラムがないため、ここではリセット処理は行わない
    await this.db.update(profiles).set({ updatedAt: new Date() }).where(eq(profiles.userId, sub.userId))
  }

  async handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    logger.info({ invoiceId: invoice.id }, 'Handling invoice payment failed')

    const invoiceId = invoice.id
    if (!invoiceId) {
      logger.warn({ invoiceId }, 'No invoice ID found')
      return
    }

    // Get subscription ID from parent.subscription_details.subscription
    const subscriptionIdOrObject = invoice.parent?.subscription_details?.subscription

    if (!subscriptionIdOrObject) {
      logger.warn({ invoiceId: invoice.id }, 'No subscription ID found in invoice')
      return
    }

    // Extract subscription ID (it might be a string or an object)
    const subscriptionId =
      typeof subscriptionIdOrObject === 'string' ? subscriptionIdOrObject : subscriptionIdOrObject.id

    // Update subscription status
    await this.db
      .update(subscriptions)
      .set({
        status: 'past_due',
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))

    // Record failed payment
    const [sub] = await this.db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
      .limit(1)

    if (sub) {
      // Get payment intent ID from payments data if available
      const paymentIntent = invoice.payments?.data?.[0]?.payment?.payment_intent
      const paymentIntentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id || null

      const paymentData = {
        userId: sub.userId,
        subscriptionId: sub.id,
        stripeInvoiceId: invoiceId,
        stripePaymentIntentId: paymentIntentId,
        amount: invoice.amount_due,
        currency: invoice.currency,
        status: 'failed' as const,
        description: `Payment failed for ${sub.plan} plan`,
        periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
        periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
        failedAt: new Date(),
      }

      await this.db.insert(paymentHistory).values(paymentData)
    }
  }

  async recordWebhookEvent(event: Stripe.Event) {
    await this.db.insert(webhookEvents).values({
      stripeEventId: event.id,
      eventType: event.type,
      apiVersion: event.api_version || null,
      payload: event,
      objectId: 'id' in event.data.object && typeof event.data.object.id === 'string' ? event.data.object.id : null,
      objectType: event.data.object.object || null,
      status: 'processed',
      processedAt: new Date(),
      eventCreatedAt: new Date(event.created * 1000),
    })
  }
}
