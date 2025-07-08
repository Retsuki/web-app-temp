import { z } from 'zod'

export const cancelSubscriptionSchema = z.object({
  immediately: z.boolean().default(false),
})

export type CancelSubscriptionDto = z.infer<typeof cancelSubscriptionSchema>

export interface CancelSubscriptionResponse {
  subscriptionId: string
  cancelAt: string | null
  message: string
}
