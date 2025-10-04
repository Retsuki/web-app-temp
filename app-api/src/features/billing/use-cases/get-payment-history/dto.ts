import { z } from 'zod'

export const paymentSchema = z.object({
  paymentId: z.string(),
  amount: z.number(),
  currency: z.string(),
  status: z.enum(['pending', 'succeeded', 'failed']),
  description: z.string().nullable(),
  paidAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
})

export const getPaymentHistorySchema = z.object({
  payments: z.array(paymentSchema),
  hasMore: z.boolean(),
})

export type GetPaymentHistoryResponse = z.infer<typeof getPaymentHistorySchema>
