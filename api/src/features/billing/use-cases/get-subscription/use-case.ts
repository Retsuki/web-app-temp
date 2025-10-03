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
      subscriptionId: subscription.id,
      plan: subscription.plan as 'free' | 'starter' | 'pro',
      status: subscription.status as 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete',
      billingCycle: subscription.billingCycle as 'monthly' | 'yearly',
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAt: subscription.cancelAt?.toISOString() || null,
      canceledAt: subscription.canceledAt?.toISOString() || null,
    }
  }
}
