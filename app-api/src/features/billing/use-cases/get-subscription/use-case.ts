import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'
import type { GetSubscriptionResponse } from './dto.js'
import { eq, plans } from '../../../../drizzle/index.js'

export class GetSubscriptionUseCase {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

  async execute(userId: string): Promise<GetSubscriptionResponse> {
    const subscription = await this.subscriptionRepository.findByUserId(userId)

    if (!subscription) {
      return null
    }

    // Resolve plan slug via join if available on repository shape
    const planSlug = (subscription as any).planSlug
    const planValue = planSlug || 'starter'

    return {
      subscriptionId: subscription.id,
      plan: planValue as 'free' | 'starter' | 'pro',
      status: subscription.status as 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete',
      billingCycle: subscription.billingCycle as 'monthly' | 'yearly',
      currentPeriodStart: subscription.currentPeriodStart.toISOString(),
      currentPeriodEnd: subscription.currentPeriodEnd.toISOString(),
      cancelAt: subscription.cancelAt?.toISOString() || null,
      canceledAt: subscription.canceledAt?.toISOString() || null,
    }
  }
}
