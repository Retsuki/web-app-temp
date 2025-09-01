// ========================================
// Sample App - Enums
// ========================================

import { pgEnum } from 'drizzle-orm/pg-core'

// Plan Enum
export const SAMPLE_PLAN_VALUES = ['free', 'indie', 'pro'] as const
export const samplePlanEnum = pgEnum('sample_plan', SAMPLE_PLAN_VALUES)
export type SamplePlan = (typeof SAMPLE_PLAN_VALUES)[number]

export const SAMPLE_PLAN = {
  FREE: 'free',
  INDIE: 'indie',
  PRO: 'pro',
} as const

// Status Enums
export const SAMPLE_PROJECT_STATUS_VALUES = ['active', 'archived', 'completed'] as const
export const sampleProjectStatusEnum = pgEnum('sample_project_status', SAMPLE_PROJECT_STATUS_VALUES)
export type SampleProjectStatus = (typeof SAMPLE_PROJECT_STATUS_VALUES)[number]

export const SAMPLE_SUBSCRIPTION_STATUS_VALUES = ['active', 'past_due', 'canceled', 'unpaid'] as const
export const sampleSubscriptionStatusEnum = pgEnum('sample_subscription_status', SAMPLE_SUBSCRIPTION_STATUS_VALUES)
export type SampleSubscriptionStatus = (typeof SAMPLE_SUBSCRIPTION_STATUS_VALUES)[number]

export const SAMPLE_PAYMENT_STATUS_VALUES = ['paid', 'failed', 'pending', 'refunded'] as const
export const samplePaymentStatusEnum = pgEnum('sample_payment_status', SAMPLE_PAYMENT_STATUS_VALUES)
export type SamplePaymentStatus = (typeof SAMPLE_PAYMENT_STATUS_VALUES)[number]

export const SAMPLE_WEBHOOK_STATUS_VALUES = ['pending', 'processed', 'failed'] as const
export const sampleWebhookStatusEnum = pgEnum('sample_webhook_status', SAMPLE_WEBHOOK_STATUS_VALUES)
export type SampleWebhookStatus = (typeof SAMPLE_WEBHOOK_STATUS_VALUES)[number]

// Billing Cycle Enum
export const SAMPLE_BILLING_CYCLE_VALUES = ['monthly', 'yearly'] as const
export const sampleBillingCycleEnum = pgEnum('sample_billing_cycle', SAMPLE_BILLING_CYCLE_VALUES)
export type SampleBillingCycle = (typeof SAMPLE_BILLING_CYCLE_VALUES)[number]