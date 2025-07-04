import { PLANS } from '../../../../constants/plans.js'
import type { GetPlansResponse } from './dto.js'

export class GetPlansUseCase {
  async execute(): Promise<GetPlansResponse> {
    // プラン一覧を返す（Freeプランは除外することも可能）
    const plans = Object.values(PLANS)

    return {
      plans: plans.filter((plan) => plan.id !== 'free'), // Freeプランは料金ページに表示しない
    }
  }
}
