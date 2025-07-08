import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { cancelSubscriptionSchema } from './dto.js'

export const cancelSubscriptionRoute = createRoute({
  method: 'delete',
  path: '/api/v1/billing/subscription',
  tags: ['billing'],
  summary: 'Cancel subscription',
  description: 'Cancel subscription immediately or at period end',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: cancelSubscriptionSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            subscriptionId: z.string(),
            cancelAt: z.string().nullable(),
            message: z.string(),
          }),
        },
      },
      description: 'Subscription canceled successfully',
    },
    401: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Unauthorized',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Subscription not found',
    },
  },
})
