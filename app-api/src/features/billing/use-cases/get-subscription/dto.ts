import { z } from 'zod'

export const subscriptionSchema = z.object({
  subscriptionId: z.string(),
  plan: z.enum(['free', 'starter', 'pro']),
  status: z.enum(['active', 'canceled', 'past_due', 'unpaid', 'incomplete']),
  billingCycle: z.enum(['monthly', 'yearly']),
  currentPeriodStart: z.string().datetime(),
  currentPeriodEnd: z.string().datetime(),
  cancelAt: z.string().datetime().nullable(),
  canceledAt: z.string().datetime().nullable(),
})

export type GetSubscriptionResponse = z.infer<typeof subscriptionSchema> | null
