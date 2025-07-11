import type { Database } from '../../drizzle/index.js'
import { UserRepository } from '../users/repositories/user.repository.js'
import { PaymentRepository } from './repositories/payment.repository.js'
import { SubscriptionRepository } from './repositories/subscription.repository.js'
import { CancelSubscriptionUseCase } from './use-cases/cancel-subscription/use-case.js'
import { CreateCheckoutUseCase } from './use-cases/create-checkout/use-case.js'
import { GetPaymentHistoryUseCase } from './use-cases/get-payment-history/use-case.js'
import { GetPlansUseCase } from './use-cases/get-plans/use-case.js'
import { GetSubscriptionUseCase } from './use-cases/get-subscription/use-case.js'
import { UpdateSubscriptionUseCase } from './use-cases/update-subscription/use-case.js'

export class BillingContainer {
  // Repositories
  public readonly subscriptionRepository: SubscriptionRepository
  public readonly paymentRepository: PaymentRepository

  // Use Cases
  public readonly createCheckoutUseCase: CreateCheckoutUseCase
  public readonly getPlansUseCase: GetPlansUseCase
  public readonly getSubscriptionUseCase: GetSubscriptionUseCase
  public readonly getPaymentHistoryUseCase: GetPaymentHistoryUseCase
  public readonly updateSubscriptionUseCase: UpdateSubscriptionUseCase
  public readonly cancelSubscriptionUseCase: CancelSubscriptionUseCase

  constructor(db: Database) {
    // Initialize repositories
    this.subscriptionRepository = new SubscriptionRepository(db)
    this.paymentRepository = new PaymentRepository(db)
    const userRepository = new UserRepository(db)

    // Initialize use cases
    this.createCheckoutUseCase = new CreateCheckoutUseCase(
      userRepository,
      this.subscriptionRepository
    )

    this.getPlansUseCase = new GetPlansUseCase()

    this.getSubscriptionUseCase = new GetSubscriptionUseCase(this.subscriptionRepository)

    this.getPaymentHistoryUseCase = new GetPaymentHistoryUseCase(this.paymentRepository)

    this.updateSubscriptionUseCase = new UpdateSubscriptionUseCase(this.subscriptionRepository)

    this.cancelSubscriptionUseCase = new CancelSubscriptionUseCase(this.subscriptionRepository)
  }
}
