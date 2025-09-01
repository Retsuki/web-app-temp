import type { GetPlansResponse } from './dto.js'
import type { Database } from '../../../../drizzle/index.js'
import { samplePlanLimits } from '../../../../drizzle/db/apps/sample/index.js'

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
  constructor(private readonly db: Database) {}

  async execute(): Promise<GetPlansResponse> {
    const rows = await this.db
      .select()
      .from(samplePlanLimits)

    const plans = rows
      .map((row) => {
        const id = row.plan as 'free' | 'indie' | 'pro'
        const featuresFromJson = (row.features as any) || {}

        const stripePriceIds =
          id === 'free'
            ? undefined
            : {
                monthly:
                  id === 'indie'
                    ? process.env.STRIPE_PRICE_ID_INDIE_MONTHLY || ''
                    : process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
                yearly:
                  id === 'indie'
                    ? process.env.STRIPE_PRICE_ID_INDIE_YEARLY || ''
                    : process.env.STRIPE_PRICE_ID_PRO_YEARLY || '',
              }

        return {
          id,
          name: NAME_MAP[id],
          description: DESC_MAP[id],
          monthlyPrice: row.monthlyPrice,
          yearlyPrice: row.yearlyPrice,
          ...(stripePriceIds ? { stripePriceIds } : {}),
          features: {
            projectLimit: row.projectsLimit,
            apiCallsPerMonth: row.monthlyUsageLimit,
            teamMembers: row.membersPerProjectLimit,
            storage: featuresFromJson.storage ?? 0,
            support: featuresFromJson.support ?? 'community',
          },
        } satisfies import('../../../../constants/plans.js').Plan
      })
      // 表示順がある場合はそれに従う
      .sort((a, b) => {
        const aOrder = rows.find((r) => r.plan === a.id)?.displayOrder ?? 0
        const bOrder = rows.find((r) => r.plan === b.id)?.displayOrder ?? 0
        return aOrder - bOrder
      })

    return { plans: plans.filter((p) => p.id !== 'free') }
  }
}
