import { AppHTTPException, ERROR_CODES } from '../../../../_shared/utils/error/index.js'
import { logger } from '../../../../_shared/utils/logger.js'
import type { UserRepository } from '../../../../features/users/repositories/user.repository.js'
import type { BillingCustomerRepository } from '../../repositories/billing-customer.repository.js'
import { stripe } from '../../../../lib/stripe.js'
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'
import type { CreateCheckoutDto, CreateCheckoutResponse } from './dto.js'
import type { BillingCycle } from '../../../../external-apis/stripe/stripe-client.js'
import type { StripeClient } from '../../../../external-apis/stripe/stripe-client.js'

export class CreateCheckoutUseCase {
  constructor(
    private userRepository: UserRepository,
    private subscriptionRepository: SubscriptionRepository,
    private billingCustomerRepository: BillingCustomerRepository,
    private stripeClient: StripeClient,
  ) {}

  private async resolveStripePriceId(planId: 'starter' | 'pro', billingCycle: BillingCycle) {
    const products = await this.stripeClient.api.products.list({ active: true, limit: 100 })
    const normalize = (v?: string | null) => (v || '').toLowerCase()
    const target = products.data.find((p) => {
      const meta = (p.metadata as any) || {}
      const metaPlan = normalize(meta.planId)
      const byMeta = (planId === 'starter' && metaPlan === 'starter') || (planId === 'pro' && metaPlan === 'pro')
      const byName =
        (planId === 'starter' && ['starter'].includes(normalize(p.name))) ||
        (planId === 'pro' && ['pro'].includes(normalize(p.name)))
      return byMeta || byName
    })

    if (!target) {
      throw new AppHTTPException(400, {
        code: ERROR_CODES.INVALID_REQUEST,
        message: `Stripe上に対象プラン(${planId})のProductが見つかりません`,
      })
    }

    const prices = await this.stripeClient.api.prices.list({ product: target.id, active: true, limit: 100 })
    const price = prices.data.find((pr) => pr.recurring?.interval === (billingCycle === 'monthly' ? 'month' : 'year'))

    if (!price?.id) {
      throw new AppHTTPException(400, {
        code: ERROR_CODES.INVALID_REQUEST,
        message: `Stripe上に対象プラン(${planId})の${billingCycle}価格が見つかりません`,
      })
    }
    return price.id
  }

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

    // 3. Price IDをStripeから解決
    const priceId = await this.resolveStripePriceId(dto.planId, dto.billingCycle)

    // 4. Stripe顧客を作成または取得（billing_customers テーブル）
    const existingBillingCustomer = await this.billingCustomerRepository.findByUserId(userId)
    let stripeCustomerId = existingBillingCustomer?.stripeCustomerId
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.userId },
      })
      stripeCustomerId = customer.id
      await this.billingCustomerRepository.create(userId, stripeCustomerId)
    }

    // 5. Checkout Sessionを作成 (成功/キャンセルURLは/settings系)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const successUrl = `${siteUrl}/${dto.locale}/settings/account?session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${siteUrl}/${dto.locale}/settings`

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
