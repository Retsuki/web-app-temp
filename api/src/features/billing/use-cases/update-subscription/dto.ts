import { z } from 'zod'

export const updateSubscriptionSchema = z.object({
  planId: z.enum(['indie', 'pro']),
  billingCycle: z.enum(['monthly', 'yearly']),
})

export type UpdateSubscriptionDto = z.infer<typeof updateSubscriptionSchema>

export interface UpdateSubscriptionResponse {
  subscriptionId: string
  plan: string
  billingCycle: string
  status: string
  message: string
}
