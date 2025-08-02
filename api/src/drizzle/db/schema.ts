import { relations, sql } from 'drizzle-orm'
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

// Enums定義
export const PLAN_VALUES = ['free', 'indie', 'pro'] as const
export const planEnum = pgEnum('plan', PLAN_VALUES)
export type Plan = (typeof PLAN_VALUES)[number]

export const PLAN = {
  FREE: 'free',
  INDIE: 'indie',
  PRO: 'pro',
} as const

export const SUBSCRIPTION_STATUS_VALUES = ['active', 'past_due', 'canceled', 'unpaid'] as const
export const subscriptionStatusEnum = pgEnum('subscription_status', SUBSCRIPTION_STATUS_VALUES)
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS_VALUES)[number]

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
} as const

export const BILLING_CYCLE_VALUES = ['monthly', 'yearly'] as const
export const billingCycleEnum = pgEnum('billing_cycle', BILLING_CYCLE_VALUES)
export type BillingCycle = (typeof BILLING_CYCLE_VALUES)[number]

export const BILLING_CYCLE = {
  MONTHLY: 'monthly',
  YEARLY: 'yearly',
} as const

export const PAYMENT_STATUS_VALUES = ['paid', 'failed', 'pending', 'refunded'] as const
export const paymentStatusEnum = pgEnum('payment_status', PAYMENT_STATUS_VALUES)
export type PaymentStatus = (typeof PAYMENT_STATUS_VALUES)[number]

export const PAYMENT_STATUS = {
  PAID: 'paid',
  FAILED: 'failed',
  PENDING: 'pending',
  REFUNDED: 'refunded',
} as const

export const CURRENCY_VALUES = ['jpy', 'usd'] as const
export const currencyEnum = pgEnum('currency', CURRENCY_VALUES)
export type Currency = (typeof CURRENCY_VALUES)[number]

export const CURRENCY = {
  JPY: 'jpy',
  USD: 'usd',
} as const

export const PAYMENT_METHOD_VALUES = ['card', 'bank_transfer'] as const
export const paymentMethodEnum = pgEnum('payment_method', PAYMENT_METHOD_VALUES)
export type PaymentMethod = (typeof PAYMENT_METHOD_VALUES)[number]

export const PAYMENT_METHOD = {
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
} as const

export const CARD_BRAND_VALUES = ['visa', 'mastercard', 'amex', 'jcb', 'diners', 'discover'] as const
export const cardBrandEnum = pgEnum('card_brand', CARD_BRAND_VALUES)
export type CardBrand = (typeof CARD_BRAND_VALUES)[number]

export const CARD_BRAND = {
  VISA: 'visa',
  MASTERCARD: 'mastercard',
  AMEX: 'amex',
  JCB: 'jcb',
  DINERS: 'diners',
  DISCOVER: 'discover',
} as const

export const WEBHOOK_EVENT_STATUS_VALUES = ['pending', 'processed', 'failed'] as const
export const webhookEventStatusEnum = pgEnum('webhook_event_status', WEBHOOK_EVENT_STATUS_VALUES)
export type WebhookEventStatus = (typeof WEBHOOK_EVENT_STATUS_VALUES)[number]

export const WEBHOOK_EVENT_STATUS = {
  PENDING: 'pending',
  PROCESSED: 'processed',
  FAILED: 'failed',
} as const

export const STRIPE_OBJECT_TYPE_VALUES = ['subscription', 'invoice', 'customer', 'payment_intent', 'charge'] as const
export const stripeObjectTypeEnum = pgEnum('stripe_object_type', STRIPE_OBJECT_TYPE_VALUES)
export type StripeObjectType = (typeof STRIPE_OBJECT_TYPE_VALUES)[number]

export const STRIPE_OBJECT_TYPE = {
  SUBSCRIPTION: 'subscription',
  INVOICE: 'invoice',
  CUSTOMER: 'customer',
  PAYMENT_INTENT: 'payment_intent',
  CHARGE: 'charge',
} as const

// ユーザープロフィールテーブル
export const profiles = pgTable('profiles', {
  // ユーザーを一意に識別するUUID
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

  // Supabase AuthのユーザーID (auth.usersのUUIDに対応)
  userId: uuid('user_id').notNull().unique(),

  // ニックネーム
  nickname: varchar('nickname', { length: 50 }).notNull(),

  // メールアドレス
  email: varchar('email', { length: 255 }).notNull().unique(),

  // 作成日時
  createdAt: timestamp('created_at').default(sql`now()`),

  // 更新日時
  updatedAt: timestamp('updated_at').default(sql`now()`),

  // 削除日時（論理削除）
  deletedAt: timestamp('deleted_at'),

  // Stripe関連
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
  plan: planEnum('plan').notNull().default(PLAN.FREE),
  monthlyUsageCount: integer('monthly_usage_count').notNull().default(0), // 月間使用回数
  usageResetAt: timestamp('usage_reset_at'), // 使用回数リセット日時
})

// サブスクリプションテーブル
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // ユーザー関連
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId, { onDelete: 'cascade' }),

    // Stripe関連ID
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull().unique(),
    stripePriceId: varchar('stripe_price_id', { length: 255 }).notNull(),
    stripeProductId: varchar('stripe_product_id', { length: 255 }).notNull(),

    // プラン情報
    plan: planEnum('plan').notNull(),
    status: subscriptionStatusEnum('status').notNull(),
    billingCycle: billingCycleEnum('billing_cycle').notNull(),

    // 請求期間
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),

    // 解約関連
    cancelAt: timestamp('cancel_at'), // 解約予定日
    canceledAt: timestamp('canceled_at'), // 解約実行日
    cancelReason: text('cancel_reason'), // 解約理由

    // 試用期間
    trialStart: timestamp('trial_start'),
    trialEnd: timestamp('trial_end'),

    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('subscriptions_user_id_idx').on(table.userId),
      statusIdx: index('subscriptions_status_idx').on(table.status),
      planIdx: index('subscriptions_plan_idx').on(table.plan),
    }
  }
)

// 支払い履歴テーブル
export const paymentHistory = pgTable(
  'payment_history',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // ユーザー関連
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId, { onDelete: 'cascade' }),

    // サブスクリプション関連
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'cascade' }),

    // Stripe関連
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }).notNull().unique(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    stripeChargeId: varchar('stripe_charge_id', { length: 255 }),

    // 支払い情報
    amount: integer('amount').notNull(), // 金額（円）
    currency: currencyEnum('currency').notNull().default(CURRENCY.JPY),
    status: paymentStatusEnum('status').notNull(),
    description: text('description'),

    // 請求期間
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),

    // 支払い方法
    paymentMethod: paymentMethodEnum('payment_method'),
    last4: varchar('last4', { length: 4 }), // カード下4桁
    brand: cardBrandEnum('brand'),

    // 返金情報
    refundedAmount: integer('refunded_amount').default(0),
    refundedAt: timestamp('refunded_at'),
    refundReason: text('refund_reason'),

    // タイムスタンプ
    paidAt: timestamp('paid_at'),
    failedAt: timestamp('failed_at'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('payment_history_user_id_idx').on(table.userId),
      subscriptionIdIdx: index('payment_history_subscription_id_idx').on(table.subscriptionId),
      statusIdx: index('payment_history_status_idx').on(table.status),
      createdAtIdx: index('payment_history_created_at_idx').on(table.createdAt),
    }
  }
)

// Webhookイベント履歴テーブル
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // Stripe Event情報
    stripeEventId: varchar('stripe_event_id', { length: 255 }).notNull().unique(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    apiVersion: varchar('api_version', { length: 50 }),

    // ペイロード
    payload: jsonb('payload').notNull(),
    objectId: varchar('object_id', { length: 255 }),
    objectType: stripeObjectTypeEnum('object_type'),

    // 処理状態
    status: webhookEventStatusEnum('status').notNull().default(WEBHOOK_EVENT_STATUS.PENDING),
    processedAt: timestamp('processed_at'),
    failureReason: text('failure_reason'),
    retryCount: integer('retry_count').default(0),

    // タイムスタンプ
    eventCreatedAt: timestamp('event_created_at').notNull(), // Stripeでのイベント作成時刻
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      eventTypeIdx: index('webhook_events_event_type_idx').on(table.eventType),
      statusIdx: index('webhook_events_status_idx').on(table.status),
      objectIdIdx: index('webhook_events_object_id_idx').on(table.objectId),
    }
  }
)

// プラン制限管理テーブル
export const planLimits = pgTable('plan_limits', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

  // プラン名
  plan: planEnum('plan').notNull().unique(),

  // 制限値
  monthlyUsageLimit: integer('monthly_usage_limit').notNull(), // 月間使用回数上限
  projectsLimit: integer('projects_limit').notNull(), // プロジェクト数上限
  membersPerProjectLimit: integer('members_per_project_limit').notNull(), // プロジェクトあたりのメンバー数上限

  // 機能フラグ
  features: jsonb('features').notNull().default(sql`'{}'::jsonb`), // { "api_access": true, "export": true, ... }

  // 料金情報（表示用）
  monthlyPrice: integer('monthly_price').notNull(), // 月額料金（円）
  yearlyPrice: integer('yearly_price').notNull(), // 年額料金（円）
  displayOrder: integer('display_order').notNull().default(0), // 表示順

  // タイムスタンプ
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
})

// リレーション定義
export const profilesRelations = relations(profiles, ({ many }) => ({
  subscriptions: many(subscriptions),
  paymentHistory: many(paymentHistory),
}))

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [subscriptions.userId],
    references: [profiles.userId],
  }),
  paymentHistory: many(paymentHistory),
}))

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  profile: one(profiles, {
    fields: [paymentHistory.userId],
    references: [profiles.userId],
  }),
  subscription: one(subscriptions, {
    fields: [paymentHistory.subscriptionId],
    references: [subscriptions.id],
  }),
}))
