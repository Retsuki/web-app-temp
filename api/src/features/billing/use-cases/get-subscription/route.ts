import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { subscriptionSchema } from './dto.js'

export const getSubscriptionRoute = createRoute({
  method: 'get',
  path: '/api/v1/billing/subscription',
  tags: ['billing'],
  summary: 'Get current subscription',
  description: 'Get current user subscription details',
  security: [{ bearerAuth: [] }],
  responses: {
    200: {
      content: {
        'application/json': {
          schema: subscriptionSchema.nullable(),
        },
      },
      description: 'Current subscription or null',
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
  },
})
