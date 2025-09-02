// ========================================
// OM専用型定義
// ========================================

import type {
  omCampaigns,
  omCoupons,
  omCreditBalances,
  omCreditTransactions,
  omEndUsers,
  omMeterEvents,
  omMeters,
  omPaymentHistory,
  omPlanLimits,
  omProjects,
  omSubscriptions,
  omUsageAggregations,
  omWebhookEvents,
} from './schema/core.js'

// プロジェクト関連
export type OmProject = typeof omProjects.$inferSelect
export type NewOmProject = typeof omProjects.$inferInsert

// メーター関連
export type OmMeter = typeof omMeters.$inferSelect
export type NewOmMeter = typeof omMeters.$inferInsert

// エンドユーザー関連
export type OmEndUser = typeof omEndUsers.$inferSelect
export type NewOmEndUser = typeof omEndUsers.$inferInsert

// クレジット関連
export type OmCreditBalance = typeof omCreditBalances.$inferSelect
export type NewOmCreditBalance = typeof omCreditBalances.$inferInsert

export type OmCreditTransaction = typeof omCreditTransactions.$inferSelect
export type NewOmCreditTransaction = typeof omCreditTransactions.$inferInsert

// メーターイベント関連
export type OmMeterEvent = typeof omMeterEvents.$inferSelect
export type NewOmMeterEvent = typeof omMeterEvents.$inferInsert

// キャンペーン関連
export type OmCampaign = typeof omCampaigns.$inferSelect
export type NewOmCampaign = typeof omCampaigns.$inferInsert

export type OmCoupon = typeof omCoupons.$inferSelect
export type NewOmCoupon = typeof omCoupons.$inferInsert

// 分析関連
export type OmUsageAggregation = typeof omUsageAggregations.$inferSelect
export type NewOmUsageAggregation = typeof omUsageAggregations.$inferInsert

// サブスクリプション関連
export type OmSubscription = typeof omSubscriptions.$inferSelect
export type NewOmSubscription = typeof omSubscriptions.$inferInsert

export type OmPaymentHistory = typeof omPaymentHistory.$inferSelect
export type NewOmPaymentHistory = typeof omPaymentHistory.$inferInsert

export type OmWebhookEvent = typeof omWebhookEvents.$inferSelect
export type NewOmWebhookEvent = typeof omWebhookEvents.$inferInsert

export type OmPlanLimit = typeof omPlanLimits.$inferSelect
export type NewOmPlanLimit = typeof omPlanLimits.$inferInsert
