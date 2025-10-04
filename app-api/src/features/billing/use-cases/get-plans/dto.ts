import type { PlanId } from '../../../../external-apis/stripe/stripe-client.js'

export interface PlanDto {
  id: PlanId
  name: string
  description: string
  monthlyPrice: number
  yearlyPrice: number
}

export interface GetPlansResponse {
  plans: PlanDto[]
}
