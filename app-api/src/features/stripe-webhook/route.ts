import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'

export const stripeWebhookRoute = createRoute({
  method: 'post',
  path: '/stripe/webhook',
  operationId: 'handleStripeWebhook',
  tags: ['stripe-webhook'],
  summary: 'Stripe webhook endpoint',
  description: 'Endpoint to receive Stripe webhook events',
  request: {
    headers: z.object({
      'stripe-signature': z.string(),
    }),
    body: {
      content: {
        'text/plain': {
          schema: z.string(),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            received: z.boolean(),
          }),
        },
      },
      description: 'Webhook processed successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Invalid webhook signature',
    },
  },
})
