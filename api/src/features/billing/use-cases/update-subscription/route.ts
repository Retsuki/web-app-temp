import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { updateSubscriptionSchema } from './dto.js'

export const updateSubscriptionRoute = createRoute({
  method: 'patch',
  path: '/api/v1/billing/subscription',
  tags: ['billing'],
  summary: 'Update subscription',
  description: 'Update subscription plan or billing cycle',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateSubscriptionSchema,
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
            plan: z.string(),
            billingCycle: z.string(),
            status: z.string(),
            message: z.string(),
          }),
        },
      },
      description: 'Subscription updated successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({
            error: z.string(),
          }),
        },
      },
      description: 'Bad request',
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
