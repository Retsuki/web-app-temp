import { AppHTTPException, ERROR_CODES } from '../../../../_shared/utils/error/index.js'
import { stripe } from '../../../../lib/stripe.js'
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'
import type { PlansRepository } from '../../repositories/plans.repository.js'
import type { UpdateSubscriptionDto, UpdateSubscriptionResponse } from './dto.js'
import type { BillingCycle, StripeClient } from '../../../../external-apis/stripe/stripe-client.js'

export class UpdateSubscriptionUseCase {
  constructor(
    private subscriptionRepository: SubscriptionRepository,
    private stripeClient: StripeClient,
    private plansRepository: PlansRepository,
  ) {}

  private isUpgrade(currentPlan: 'free' | 'starter' | 'pro', newPlan: 'starter' | 'pro') {
    const order: Array<'free' | 'starter' | 'pro'> = ['free', 'starter', 'pro']
    return order.indexOf(newPlan) > order.indexOf(currentPlan)
  }

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

  async execute(userId: string, dto: UpdateSubscriptionDto): Promise<UpdateSubscriptionResponse> {
    // 1. 現在のサブスクリプションを取得
    const currentSubscription = await this.subscriptionRepository.findByUserId(userId)
    if (!currentSubscription) {
      throw new AppHTTPException(404, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'アクティブなサブスクリプションが見つかりません',
      })
    }

    // 2. 新しいPrice IDを取得
    const newPriceId = await this.resolveStripePriceId(dto.planId, dto.billingCycle as BillingCycle)

    // 3. 同じプランへの変更はエラー
    if (
      (currentSubscription as any).planSlug === dto.planId &&
      currentSubscription.billingCycle === dto.billingCycle
    ) {
      throw new AppHTTPException(400, {
        code: ERROR_CODES.INVALID_REQUEST,
        message: '既に同じプランです',
      })
    }

    // 4. Stripeサブスクリプションを更新
    const stripeSubscription = await stripe.subscriptions.retrieve(
      currentSubscription.stripeSubscriptionId
    )

    // アップグレードかダウングレードかを判定
    const isUpgradeRequest = this.isUpgrade(((currentSubscription as any).planSlug || 'starter') as any, dto.planId)

    // 更新を実行
    const updatedSubscription = await stripe.subscriptions.update(stripeSubscription.id, {
      items: [
        {
          id: stripeSubscription.items.data[0].id,
          price: newPriceId,
        },
      ],
      // アップグレードは即時、ダウングレードは期間終了時
      proration_behavior: isUpgradeRequest ? 'always_invoice' : 'none',
      ...(isUpgradeRequest
        ? {}
        : { cancel_at_period_end: false, billing_cycle_anchor: 'unchanged' }),
    })

    // 5. DBを更新
    const newPlan = await this.plansRepository.findByPlan(dto.planId)
    await this.subscriptionRepository.updateByStripeSubscriptionId(
      currentSubscription.stripeSubscriptionId,
      {
        planId: newPlan?.id,
        billingCycle: dto.billingCycle,
        stripePriceId: newPriceId,
      }
    )

    return {
      subscriptionId: currentSubscription.id,
      plan: dto.planId,
      billingCycle: dto.billingCycle,
      status: updatedSubscription.status,
      message: isUpgradeRequest
        ? 'プランをアップグレードしました。差額は日割りで請求されます。'
        : 'プランを変更しました。次回請求時から新しいプランが適用されます。',
    }
  }
}
