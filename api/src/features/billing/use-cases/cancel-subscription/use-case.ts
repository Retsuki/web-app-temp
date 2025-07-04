import { AppHTTPException, ERROR_CODES } from '../../../../_shared/utils/error/index.js'
import { stripe } from '../../../../lib/stripe.js'
import type { SubscriptionRepository } from '../../repositories/subscription.repository.js'
import type { CancelSubscriptionDto, CancelSubscriptionResponse } from './dto.js'

export class CancelSubscriptionUseCase {
  constructor(private subscriptionRepository: SubscriptionRepository) {}

  async execute(userId: string, dto: CancelSubscriptionDto): Promise<CancelSubscriptionResponse> {
    // 1. 現在のサブスクリプションを取得
    const currentSubscription = await this.subscriptionRepository.findByUserId(userId)
    if (!currentSubscription) {
      throw new AppHTTPException(404, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'アクティブなサブスクリプションが見つかりません',
      })
    }

    // 2. Stripeサブスクリプションを解約
    let canceledSubscription
    if (dto.immediately) {
      // 即時解約
      canceledSubscription = await stripe.subscriptions.cancel(currentSubscription.stripeSubscriptionId)
    } else {
      // 期間終了時に解約
      canceledSubscription = await stripe.subscriptions.update(
        currentSubscription.stripeSubscriptionId,
        {
          cancel_at_period_end: true,
        }
      )
    }

    // 3. DBを更新
    await this.subscriptionRepository.updateByStripeSubscriptionId(
      currentSubscription.stripeSubscriptionId,
      {
        cancelAt: canceledSubscription.cancel_at 
          ? new Date(canceledSubscription.cancel_at * 1000)
          : null,
        status: canceledSubscription.status as any,
      }
    )

    return {
      subscriptionId: currentSubscription.subscriptionId,
      cancelAt: canceledSubscription.cancel_at 
        ? new Date(canceledSubscription.cancel_at * 1000).toISOString()
        : null,
      message: dto.immediately
        ? 'サブスクリプションを解約しました。'
        : `サブスクリプションは${new Date(canceledSubscription.current_period_end * 1000).toLocaleDateString('ja-JP')}に解約されます。それまではサービスをご利用いただけます。`,
    }
  }
}