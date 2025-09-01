// ========================================
// Sample App - Type Definitions
// ========================================

import type { InferInsertModel, InferSelectModel } from 'drizzle-orm'
import type {
  samplePaymentHistory,
  samplePlanLimits,
  sampleProjects,
  sampleSubscriptions,
  sampleWebhookEvents,
} from './schema.js'

// ========================================
// Projects Types
// ========================================

export type SampleProject = InferSelectModel<typeof sampleProjects>
export type NewSampleProject = InferInsertModel<typeof sampleProjects>

// ========================================
// Subscriptions Types
// ========================================

export type SampleSubscription = InferSelectModel<typeof sampleSubscriptions>
export type NewSampleSubscription = InferInsertModel<typeof sampleSubscriptions>

// ========================================
// Payment History Types
// ========================================

export type SamplePaymentHistory = InferSelectModel<typeof samplePaymentHistory>
export type NewSamplePaymentHistory = InferInsertModel<typeof samplePaymentHistory>

// ========================================
// Webhook Events Types
// ========================================

export type SampleWebhookEvent = InferSelectModel<typeof sampleWebhookEvents>
export type NewSampleWebhookEvent = InferInsertModel<typeof sampleWebhookEvents>

// ========================================
// Plan Limits Types
// ========================================

export type SamplePlanLimit = InferSelectModel<typeof samplePlanLimits>
export type NewSamplePlanLimit = InferInsertModel<typeof samplePlanLimits>

// ========================================
// Utility Types
// ========================================

export type SampleProjectWithRelations = SampleProject & {
  // 関連データを含む型定義
}

export type SampleSubscriptionWithPayments = SampleSubscription & {
  paymentHistory: SamplePaymentHistory[]
}
