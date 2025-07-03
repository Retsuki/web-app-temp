import type { Database } from '@/drizzle/db/database.js'
import { paymentHistory } from '@/drizzle/db/schema.js'
import { eq, desc } from 'drizzle-orm'

export interface Payment {
  paymentId: string
  userId: string
  stripePaymentIntentId: string | null
  stripeInvoiceId: string | null
  amount: number
  currency: string
  status: 'pending' | 'succeeded' | 'failed'
  description: string | null
  metadata: Record<string, any>
  paidAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export class PaymentRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string, limit = 10): Promise<Payment[]> {
    return await this.db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.userId, userId))
      .orderBy(desc(paymentHistory.createdAt))
      .limit(limit)
  }

  async findByStripeInvoiceId(stripeInvoiceId: string): Promise<Payment | null> {
    const result = await this.db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.stripeInvoiceId, stripeInvoiceId))
      .limit(1)

    return result[0] || null
  }

  async create(data: Omit<Payment, 'paymentId' | 'createdAt' | 'updatedAt'>): Promise<Payment> {
    const result = await this.db
      .insert(paymentHistory)
      .values({
        ...data,
        status: data.status as 'pending' | 'succeeded' | 'failed',
      })
      .returning()

    return result[0]
  }

  async update(
    paymentId: string,
    data: Partial<Omit<Payment, 'paymentId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Payment | null> {
    const result = await this.db
      .update(paymentHistory)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(paymentHistory.paymentId, paymentId))
      .returning()

    return result[0] || null
  }
}