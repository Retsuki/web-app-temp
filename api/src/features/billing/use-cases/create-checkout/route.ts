import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { createCheckoutSchema } from './dto.js'

export const createCheckoutRoute = createRoute({
  method: 'post',
  path: '/billing/checkout',
  tags: ['billing'],
  summary: 'Create checkout session',
  description: 'Create a Stripe checkout session for subscription',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: createCheckoutSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            checkoutUrl: z.string().url(),
            sessionId: z.string(),
          }),
        },
      },
      description: 'Checkout session created successfully',
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
      description: 'User not found',
    },
  },
})
