import { z } from 'zod'
import type { Plan } from '../../../../constants/plans.js'

export interface GetPlansResponse {
  plans: Plan[]
}
