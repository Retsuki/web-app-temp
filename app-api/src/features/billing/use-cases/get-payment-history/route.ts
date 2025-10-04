import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'
import { getPaymentHistorySchema } from './dto.js'

export const getPaymentHistoryRoute = createRoute({
  method: 'get',
  path: '/billing/history',
  operationId: 'getPaymentHistory',
  tags: ['billing'],
  summary: 'Get payment history',
  description: 'Get user payment history',
  security: [{ bearerAuth: [] }],
  request: {
    query: z.object({
      limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: getPaymentHistorySchema,
        },
      },
      description: 'Payment history',
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
