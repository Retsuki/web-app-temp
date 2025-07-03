import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'

export class CancelSubscriptionUseCase {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

  async execute(userId: string) {
    // TODO: Implement subscription cancellation logic with Stripe

    return null
  }
}
