import type { BillingContainer } from '../../container.js'
import type { GetPlansResponse } from './dto.js'

const NAME_MAP: Record<'free' | 'indie' | 'pro', string> = {
  free: 'Free',
  indie: 'Indie',
  pro: 'Pro',
}

const DESC_MAP: Record<'free' | 'indie' | 'pro', string> = {
  free: '個人の趣味プロジェクトに最適',
  indie: '個人開発者や小規模プロジェクト向け',
  pro: 'チームや成長中のビジネス向け',
}

export class GetPlansUseCase {
  constructor(private readonly container: BillingContainer) {}

  async execute(): Promise<GetPlansResponse> {
    const plansRepository = this.container.plansRepository
    const planLimits = await plansRepository.findAll()

    const plans = planLimits
      .filter((p) => p.plan !== 'free')
      .map((planLimit) => {
        const stripePriceIds = {
          monthly:
            planLimit.plan === 'indie'
              ? process.env.STRIPE_PRICE_ID_INDIE_MONTHLY || ''
              : process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
          yearly:
            planLimit.plan === 'indie'
              ? process.env.STRIPE_PRICE_ID_INDIE_YEARLY || ''
              : process.env.STRIPE_PRICE_ID_PRO_YEARLY || '',
        }

        return {
          id: planLimit.plan,
          name: NAME_MAP[planLimit.plan],
          description: DESC_MAP[planLimit.plan],
          monthlyPrice: planLimit.monthlyPrice,
          yearlyPrice: planLimit.yearlyPrice,
          stripePriceIds,
          features: {
            projectLimit: planLimit.projectsLimit,
            apiCallsPerMonth: planLimit.monthlyUsageLimit,
            teamMembers: planLimit.membersPerProjectLimit,
            storage: planLimit.features.storage ?? 0,
            support: planLimit.features.support ?? 'community',
          },
        }
      })

    return { plans }
  }
}
