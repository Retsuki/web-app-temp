import type { PaymentRepository } from '../../repositories/payment.repository.js'
import type { GetPaymentHistoryResponse } from './dto.js'

export class GetPaymentHistoryUseCase {
  constructor(private paymentRepository: PaymentRepository) {}

  async execute(userId: string, limit = 10): Promise<GetPaymentHistoryResponse> {
    const payments = await this.paymentRepository.findByUserId(userId, limit + 1)
    
    // Check if there are more payments
    const hasMore = payments.length > limit
    if (hasMore) {
      payments.pop() // Remove the extra item
    }
    
    return {
      payments: payments.map(payment => ({
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        paidAt: payment.paidAt?.toISOString() || null,
        createdAt: payment.createdAt.toISOString(),
      })),
      hasMore,
    }
  }
}