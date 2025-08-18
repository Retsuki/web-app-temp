import { createRoute } from '@hono/zod-openapi'
import { z } from 'zod'

const planSchema = z.object({
  id: z.enum(['free', 'indie', 'pro']),
  name: z.string(),
  description: z.string(),
  monthlyPrice: z.number(),
  yearlyPrice: z.number(),
  features: z.object({
    projectLimit: z.number(),
    apiCallsPerMonth: z.number(),
    teamMembers: z.number(),
    storage: z.number(),
    support: z.enum(['community', 'email', 'priority']),
  }),
})

export const getPlansRoute = createRoute({
  method: 'get',
  path: '/plans',
  operationId: 'getPlans',
  tags: ['billing'],
  summary: 'Get available plans',
  description: 'Get list of available subscription plans',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            plans: z.array(planSchema),
          }),
        },
      },
      description: 'List of available plans',
    },
  },
})
