import { relations, sql } from 'drizzle-orm'
import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

// Enums定義
export const PLAN_VALUES = ['free', 'indie', 'pro'] as const
export const planEnum = pgEnum('plan', PLAN_VALUES)
export type Plan = (typeof PLAN_VALUES)[number]

export const PLAN = {
  FREE: 'free',
  INDIE: 'indie',
  PRO: 'pro',
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

  // 言語設定 (ja, en など)
  language: varchar('language', { length: 10 }).default('ja'),

  // 作成日時
  createdAt: timestamp('created_at').default(sql`now()`),

  // 更新日時
  updatedAt: timestamp('updated_at').default(sql`now()`),

  // 削除日時（論理削除）
  deletedAt: timestamp('deleted_at'),

  // Stripe関連
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
  plan: varchar('plan', { length: 50 }).notNull().default('free'), // free, standard, pro
  remainedCredits: integer('remained_credits').notNull().default(500), // 残りクレジット数
})

// プロジェクトテーブル（開発者のプロジェクト）
export const omProjects = pgTable(
  'om_projects',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // 開発者情報（profilesテーブルのidを参照）
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.id),

    // プロジェクト情報
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('om_projects_user_id_idx').on(table.userId),
    }
  }
)

// 汎用プロジェクトテーブル
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // ユーザー関連（Supabase AuthのユーザーIDで紐付け）
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId, { onDelete: 'cascade' }),

    // プロジェクト基本情報
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: varchar('status', { length: 50 }).notNull().default('active'), // active, archived, completed
    
    // プロジェクト詳細
    tags: jsonb('tags').notNull().default(sql`'[]'::jsonb`), // タグ配列
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`), // カスタムメタデータ
    
    // 日付関連
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    
    // 優先度と進捗
    priority: integer('priority').notNull().default(0), // 0=低, 1=中, 2=高
    progress: integer('progress').notNull().default(0), // 0-100%
    
    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
    deletedAt: timestamp('deleted_at'), // 論理削除
  },
  (table) => {
    return {
      userIdIdx: index('projects_user_id_idx').on(table.userId),
      statusIdx: index('projects_status_idx').on(table.status),
      createdAtIdx: index('projects_created_at_idx').on(table.createdAt),
    }
  }
)

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
    status: varchar('status', { length: 50 }).notNull(), // active, past_due, canceled, unpaid
    billingCycle: varchar('billing_cycle', { length: 20 }).notNull(), // monthly, yearly

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
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, {
      onDelete: 'cascade',
    }),

    // Stripe関連
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }).notNull().unique(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    stripeChargeId: varchar('stripe_charge_id', { length: 255 }),

    // 支払い情報
    amount: integer('amount').notNull(), // 金額（円）
    currency: varchar('currency', { length: 10 }).notNull().default('jpy'),
    status: varchar('status', { length: 50 }).notNull(), // paid, failed, pending, refunded
    description: text('description'),

    // 請求期間
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),

    // 支払い方法
    paymentMethod: varchar('payment_method', { length: 50 }), // card, bank_transfer
    last4: varchar('last4', { length: 4 }), // カード下4桁
    brand: varchar('brand', { length: 20 }), // visa, mastercard, amex等

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
    eventType: varchar('event_type', { length: 100 }).notNull(), // customer.subscription.created等
    apiVersion: varchar('api_version', { length: 50 }),

    // ペイロード
    payload: jsonb('payload').notNull(),
    objectId: varchar('object_id', { length: 255 }), // 関連オブジェクトID（sub_xxx, in_xxx等）
    objectType: varchar('object_type', { length: 50 }), // subscription, invoice, customer等

    // 処理状態
    status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, processed, failed
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
  projects: many(projects),
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

export const projectsRelations = relations(projects, ({ one }) => ({
  profile: one(profiles, {
    fields: [projects.userId],
    references: [profiles.userId],
  }),
}))
