import type { Database } from "@app/drizzle/db/index.js"
import { eq, samplePlanLimits } from "@app/drizzle/db/index.js"

export interface PlanLimit {
  id: string
  plan: "free" | "indie" | "pro"
  projectsLimit: number
  monthlyUsageLimit: number
  membersPerProjectLimit: number
  features: {
    storage?: number
    support?: "community" | "email" | "priority"
  }
  monthlyPrice: number
  yearlyPrice: number
  displayOrder: number
  createdAt?: Date
  updatedAt?: Date
}

export class PlansRepository {
  constructor(private db: Database) {}

  async findAll(): Promise<PlanLimit[]> {
    const plans = await this.db
      .select()
      .from(samplePlanLimits)
      .orderBy(samplePlanLimits.displayOrder)

    return plans.map((plan) => ({
      id: plan.id,
      plan: plan.plan as "free" | "indie" | "pro",
      projectsLimit: plan.projectsLimit,
      monthlyUsageLimit: plan.monthlyUsageLimit,
      membersPerProjectLimit: plan.membersPerProjectLimit,
      features: plan.features as PlanLimit["features"],
      monthlyPrice: plan.monthlyPrice,
      yearlyPrice: plan.yearlyPrice,
      displayOrder: plan.displayOrder,
      createdAt: plan.createdAt || undefined,
      updatedAt: plan.updatedAt || undefined,
    }))
  }

  async findByPlan(plan: "free" | "indie" | "pro"): Promise<PlanLimit | null> {
    const [result] = await this.db
      .select()
      .from(samplePlanLimits)
      .where(eq(samplePlanLimits.plan, plan))
      .limit(1)

    if (!result) {
      return null
    }

    return {
      id: result.id,
      plan: result.plan as "free" | "indie" | "pro",
      projectsLimit: result.projectsLimit,
      monthlyUsageLimit: result.monthlyUsageLimit,
      membersPerProjectLimit: result.membersPerProjectLimit,
      features: result.features as PlanLimit["features"],
      monthlyPrice: result.monthlyPrice,
      yearlyPrice: result.yearlyPrice,
      displayOrder: result.displayOrder,
      createdAt: result.createdAt || undefined,
      updatedAt: result.updatedAt || undefined,
    }
  }
}
