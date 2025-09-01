import { pgEnum } from 'drizzle-orm/pg-core'

/** コンテンツ生成スケジュールタイプ */
export const CONTENT_GENERATION_SCHEDULE_TYPES = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY: 'MONTHLY',
  INTERVAL: 'INTERVAL',
  SPECIFIC_DATES: 'SPECIFIC_DATES',
} as const

/** DAILY, WEEKLY, MONTHLY, INTERVAL, SPECIFIC_DATES */
export const contentGenerationScheduleTypeEnum = pgEnum(
  'content_generation_schedule_type',
  Object.values(CONTENT_GENERATION_SCHEDULE_TYPES) as [string, ...string[]]
)

export type ContentGenerationScheduleType =
  (typeof CONTENT_GENERATION_SCHEDULE_TYPES)[keyof typeof CONTENT_GENERATION_SCHEDULE_TYPES]

/** 投稿スケジュールタイプ */
export const POST_SCHEDULE_TYPES = {
  DAILY: 'DAILY',
  WEEKLY: 'WEEKLY',
  MONTHLY_DATE: 'MONTHLY_DATE',
  MONTHLY_NTH: 'MONTHLY_NTH',
  INTERVAL: 'INTERVAL',
} as const

/** DAILY, WEEKLY, MONTHLY_DATE, MONTHLY_NTH, INTERVAL */
export const postScheduleTypeEnum = pgEnum(
  'post_schedule_type',
  Object.values(POST_SCHEDULE_TYPES) as [string, ...string[]]
)

export type PostScheduleType = (typeof POST_SCHEDULE_TYPES)[keyof typeof POST_SCHEDULE_TYPES]

/** 間隔単位 */
export const INTERVAL_UNITS = {
  HOURS: 'HOURS',
  DAYS: 'DAYS',
  WEEKS: 'WEEKS',
  MONTHS: 'MONTHS',
} as const

/** HOURS, DAYS, WEEKS, MONTHS */
export const intervalUnitEnum = pgEnum(
  'interval_unit',
  Object.values(INTERVAL_UNITS) as [string, ...string[]]
)

export type IntervalUnit = (typeof INTERVAL_UNITS)[keyof typeof INTERVAL_UNITS]

/** 投稿ステータス */
export const POST_STATUSES = {
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  POSTED: 'posted',
  FAILED: 'failed',
} as const

/** draft, scheduled, posted, failed */
export const postStatusEnum = pgEnum(
  'post_status',
  Object.values(POST_STATUSES) as [string, ...string[]]
)

export type PostStatus = (typeof POST_STATUSES)[keyof typeof POST_STATUSES]

/** 投稿タイプ */
export const POST_TYPES = {
  MANUAL: 'manual',
  SCHEDULED: 'scheduled',
  AUTOMATED: 'automated',
} as const

/** manual, scheduled, automated */
export const postTypeEnum = pgEnum('post_type', Object.values(POST_TYPES) as [string, ...string[]])

export type PostType = (typeof POST_TYPES)[keyof typeof POST_TYPES]

/** 投稿ターゲットステータス */
export const POST_TARGET_STATUSES = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  QUEUED: 'queued',
  PROCESSING: 'processing',
  POSTED: 'posted',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  SKIPPED: 'skipped',
} as const

/** draft, pending, scheduled, queued, processing, posted, failed, cancelled, skipped */
export const postTargetStatusEnum = pgEnum(
  'post_target_status',
  Object.values(POST_TARGET_STATUSES) as [string, ...string[]]
)

export type PostTargetStatus = (typeof POST_TARGET_STATUSES)[keyof typeof POST_TARGET_STATUSES]

/** プラットフォーム */
export const PLATFORMS = {
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
} as const

/** twitter, instagram, tiktok, youtube */
export const platformEnum = pgEnum('platform', Object.values(PLATFORMS) as [string, ...string[]])

export type Platform = (typeof PLATFORMS)[keyof typeof PLATFORMS]

/** サブスクリプション状態 */
export const SUBSCRIPTION_STATUSES = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  CANCELED: 'canceled',
  PAST_DUE: 'past_due',
  UNPAID: 'unpaid',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
} as const

/** trialing, active, canceled, past_due, unpaid, incomplete, incomplete_expired */
export const subscriptionStatusEnum = pgEnum(
  'subscription_status',
  Object.values(SUBSCRIPTION_STATUSES) as [string, ...string[]]
)

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[keyof typeof SUBSCRIPTION_STATUSES]

/** 支払いプロバイダー */
export const PAYMENT_PROVIDERS = {
  STRIPE: 'stripe',
  REVENUE_CAT: 'revenuecat',
} as const

/** stripe, revenuecat */
export const paymentProviderEnum = pgEnum(
  'payment_provider',
  Object.values(PAYMENT_PROVIDERS) as [string, ...string[]]
)

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[keyof typeof PAYMENT_PROVIDERS]

/** シーンステータス */
export const SCENE_STATUSES = {
  ACTIVE: 'active',
  USED: 'used',
  ARCHIVED: 'archived',
} as const

/** active, used, archived */
export const sceneStatusEnum = pgEnum(
  'scene_status',
  Object.values(SCENE_STATUSES) as [string, ...string[]]
)

export type SceneStatus = (typeof SCENE_STATUSES)[keyof typeof SCENE_STATUSES]

/** フォーマットグレード */
export const FORMAT_GRADES = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
} as const

/** basic, premium, enterprise */
export const formatGradeEnum = pgEnum(
  'format_grade',
  Object.values(FORMAT_GRADES) as [string, ...string[]]
)

export type FormatGrade = (typeof FORMAT_GRADES)[keyof typeof FORMAT_GRADES]
