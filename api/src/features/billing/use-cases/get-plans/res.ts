import { z } from 'zod'

export const planSchema = z.object({
  id: z.enum(['free', 'starter', 'pro']),
  name: z.string(),
  description: z.string(),
  monthlyPrice: z.number(),
  yearlyPrice: z.number(),
})

export const getPlansRes = z.object({
  plans: z.array(planSchema),
})

