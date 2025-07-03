import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'

export class UpdateSubscriptionUseCase {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

  async execute(userId: string, data: any) {
    // TODO: Implement subscription update logic with Stripe

    return null
  }
}
