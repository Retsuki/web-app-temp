import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'

export class GetSubscriptionUseCase {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

  async execute(userId: string) {
    const subscription = await this.subscriptionRepository.findByUserId(userId)

    return subscription
  }
}
