import { AppHTTPException, ERROR_CODES } from '../../../../_shared/utils/error/index.js'
import { getStripePriceId, isUpgrade } from '../../../../constants/plans.js'
import { stripe } from '../../../../lib/stripe.js'
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'
import type { UpdateSubscriptionDto, UpdateSubscriptionResponse } from './dto.js'

export class UpdateSubscriptionUseCase {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

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
    const newPriceId = getStripePriceId(dto.planId, dto.billingCycle)
    if (!newPriceId) {
      throw new AppHTTPException(400, {
        code: ERROR_CODES.INVALID_REQUEST,
        message: '無効なプランまたは請求サイクルです',
      })
    }

    // 3. 同じプランへの変更はエラー
    if (
      currentSubscription.plan === dto.planId &&
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
    const isUpgradeRequest = isUpgrade(currentSubscription.plan, dto.planId)

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
    await this.subscriptionRepository.updateByStripeSubscriptionId(
      currentSubscription.stripeSubscriptionId,
      {
        plan: dto.planId,
        billingCycle: dto.billingCycle,
        stripePriceId: newPriceId,
      }
    )

    return {
      subscriptionId: currentSubscription.subscriptionId,
      plan: dto.planId,
      billingCycle: dto.billingCycle,
      status: updatedSubscription.status,
      message: isUpgradeRequest
        ? 'プランをアップグレードしました。差額は日割りで請求されます。'
        : 'プランを変更しました。次回請求時から新しいプランが適用されます。',
    }
  }
}
