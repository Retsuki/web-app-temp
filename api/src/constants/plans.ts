export type PlanId = 'free' | 'indie' | 'pro'
export type BillingCycle = 'monthly' | 'yearly'

export interface PlanFeatures {
  projectLimit: number // -1 for unlimited
  apiCallsPerMonth: number
  teamMembers: number
  storage: number // GB
  support: 'community' | 'email' | 'priority'
}

export interface Plan {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
  stripePriceIds?: {
    monthly: string
    yearly: string
  }
  features: PlanFeatures
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: '個人の趣味プロジェクトに最適',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      projectLimit: 1,
      apiCallsPerMonth: 1000,
      teamMembers: 1,
      storage: 1,
      support: 'community',
    },
  },
  indie: {
    id: 'indie',
    name: 'Indie',
    description: '個人開発者や小規模プロジェクト向け',
    monthlyPrice: 1000,
    yearlyPrice: 10000,
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ID_INDIE_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_ID_INDIE_YEARLY!,
    },
    features: {
      projectLimit: 5,
      apiCallsPerMonth: 10000,
      teamMembers: 3,
      storage: 10,
      support: 'email',
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'チームや成長中のビジネス向け',
    monthlyPrice: 3000,
    yearlyPrice: 30000,
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY!,
    },
    features: {
      projectLimit: -1, // 無制限
      apiCallsPerMonth: 100000,
      teamMembers: 10,
      storage: 100,
      support: 'priority',
    },
  },
} as const

// ヘルパー関数
export function getPlanById(planId: PlanId): Plan {
  return PLANS[planId]
}

export function getStripePriceId(planId: PlanId, billingCycle: BillingCycle): string | null {
  if (planId === 'free') {
    return null
  }
  return PLANS[planId].stripePriceIds?.[billingCycle] ?? null
}

export function isUpgrade(currentPlan: PlanId, newPlan: PlanId): boolean {
  const planOrder: PlanId[] = ['free', 'indie', 'pro']
  return planOrder.indexOf(newPlan) > planOrder.indexOf(currentPlan)
}
