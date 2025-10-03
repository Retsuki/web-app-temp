import type Stripe from 'stripe'
import type { App } from '../../_shared/factory/index.js'
import { logger } from '../../_shared/utils/logger.js'
import { getStripeClient } from '../../external-apis/stripe/stripe-client.js'
import { stripeWebhookRoute } from './route.js'
import { WebhookHandlers } from './webhook-handlers.js'

export const stripeWebhookApi = (app: App) => {
  app.openapi(stripeWebhookRoute, async (c) => {
    const signature = c.req.header('stripe-signature')
    if (!signature) {
      return c.json({ error: 'Missing stripe-signature header' }, 400)
    }

    const body = await c.req.text()
    const { db } = c.get('services')
    const handlers = new WebhookHandlers(db)

    let event: Stripe.Event
    try {
      const stripeClient = getStripeClient()
      event = stripeClient.constructEvent(body, signature)
    } catch (err) {
      logger.error({ err }, 'Webhook signature verification failed')
      return c.json({ error: 'Invalid signature' }, 400)
    }

    // Record the event
    await handlers.recordWebhookEvent(event)

    // Handle the event
    try {
      switch (event.type) {
        case 'customer.subscription.created':
          await handlers.handleSubscriptionCreated(event.data.object as Stripe.Subscription)
          break
        case 'customer.subscription.updated':
          await handlers.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
          break
        case 'customer.subscription.deleted':
          await handlers.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
          break
        case 'invoice.payment_succeeded':
          await handlers.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
          break
        case 'invoice.payment_failed':
          await handlers.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
          break
        default: {
          logger.info({ type: event.type }, 'Unhandled webhook event type')
        }
      }
    } catch (error) {
      logger.error({ error, eventType: event.type }, 'Error handling webhook')
    }

    return c.json({ received: true }, 200)
  })
}
