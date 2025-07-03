import { AppHTTPException, ERROR_CODES } from '../../../../_shared/utils/error/index.js'
import { logger } from '../../../../_shared/utils/logger.js'
import { getStripePriceId } from '../../../../constants/plans.js'
import type { UserRepository } from '../../../../features/users/repositories/user.repository.js'
import { STRIPE_CONFIG, stripe } from '../../../../lib/stripe.js'
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'
import type { CreateCheckoutDto, CreateCheckoutResponse } from './dto.js'

export class CreateCheckoutUseCase {
  constructor(
    private userRepository: UserRepository,
    private subscriptionRepository: SubscriptionRepository
  ) {}

  async execute(userId: string, dto: CreateCheckoutDto): Promise<CreateCheckoutResponse> {
    // 1. ユーザー情報を取得
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new AppHTTPException(404, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'ユーザーが見つかりません',
      })
    }

    // 2. 既存のアクティブなサブスクリプションがないか確認
    const existingSubscription = await this.subscriptionRepository.findByUserId(userId)
    if (existingSubscription) {
      throw new AppHTTPException(400, {
        code: ERROR_CODES.CONFLICT,
        message: '既にアクティブなサブスクリプションが存在します',
      })
    }

    // 3. Price IDを取得
    const priceId = getStripePriceId(dto.planId, dto.billingCycle)
    if (!priceId) {
      throw new AppHTTPException(400, {
        code: ERROR_CODES.INVALID_REQUEST,
        message: '無効なプランまたは請求サイクルです',
      })
    }

    // 4. Stripe顧客を作成または取得
    let stripeCustomerId = user.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.userId,
        },
      })
      stripeCustomerId = customer.id

      // ユーザーのStripe顧客IDを更新
      await this.userRepository.updateStripeCustomerId(userId, stripeCustomerId)
    }

    // 5. Checkout Sessionを作成
    const successUrl = STRIPE_CONFIG.urls.success.replace('{locale}', dto.locale)
    const cancelUrl = STRIPE_CONFIG.urls.cancel.replace('{locale}', dto.locale)

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      locale: dto.locale === 'ja' ? 'ja' : 'en',
      metadata: {
        userId,
        planId: dto.planId,
        billingCycle: dto.billingCycle,
      },
      subscription_data: {
        metadata: {
          userId,
          planId: dto.planId,
          billingCycle: dto.billingCycle,
        },
      },
    })

    if (!session.url) {
      throw new AppHTTPException(500, {
        code: ERROR_CODES.UNKNOWN_ERROR,
        message: 'チェックアウトセッションの作成に失敗しました',
      })
    }

    logger.info({ sessionId: session.id }, 'Checkout session created')

    return {
      checkoutUrl: session.url,
      sessionId: session.id,
    }
  }
}
