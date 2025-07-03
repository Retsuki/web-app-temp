import { desc, eq } from 'drizzle-orm'
import { paymentHistory } from '../../../drizzle/db/schema.js'
import type { Database } from '../../../drizzle/index.js'

export class PaymentRepository {
  constructor(private db: Database) {}

  async findByUserId(userId: string, limit = 10) {
    return await this.db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.userId, userId))
      .orderBy(desc(paymentHistory.createdAt))
      .limit(limit)
  }

  async findByStripeInvoiceId(stripeInvoiceId: string) {
    const [result] = await this.db
      .select()
      .from(paymentHistory)
      .where(eq(paymentHistory.stripeInvoiceId, stripeInvoiceId))
      .limit(1)

    return result || null
  }

  async create(
    data: Omit<typeof paymentHistory.$inferInsert, 'paymentId' | 'createdAt' | 'updatedAt'>
  ) {
    const [result] = await this.db
      .insert(paymentHistory)
      .values({
        ...data,
        status: data.status as 'pending' | 'succeeded' | 'failed',
      })
      .returning()

    return result || null
  }

  async update(
    paymentId: string,
    data: Partial<Omit<typeof paymentHistory.$inferInsert, 'paymentId' | 'createdAt' | 'updatedAt'>>
  ) {
    const [result] = await this.db
      .update(paymentHistory)
      .set({
        ...data,
      })
      .where(eq(paymentHistory.id, paymentId))
      .returning()

    return result || null
  }
}
