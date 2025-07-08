import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'
import type { GetSubscriptionResponse } from './dto.js'

export class GetSubscriptionUseCase {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

  async execute(userId: string): Promise<GetSubscriptionResponse> {
    const subscription = await this.subscriptionRepository.findByUserId(userId)

    if (!subscription) {
      return null
    }

    return {
      subscriptionId: subscription.subscriptionId,
      plan: subscription.plan,
      status: subscription.status,
      billingCycle: subscription.billingCycle,
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAt: subscription.cancelAt?.toISOString() || null,
      canceledAt: subscription.canceledAt?.toISOString() || null,
    }
  }
}
