import { z } from 'zod'

export const createCheckoutSchema = z.object({
  planId: z.enum(['indie', 'pro']),
  billingCycle: z.enum(['monthly', 'yearly']),
  locale: z.enum(['ja', 'en']).default('ja'),
})

export type CreateCheckoutDto = z.infer<typeof createCheckoutSchema>

export interface CreateCheckoutResponse {
  checkoutUrl: string
  sessionId: string
}
