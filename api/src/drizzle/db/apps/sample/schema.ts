// ========================================
// Sample App - Database Schema
// ========================================

import { relations, sql } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import {
  sampleBillingCycleEnum,
  samplePaymentStatusEnum,
  samplePlanEnum,
  sampleProjectStatusEnum,
  sampleSubscriptionStatusEnum,
  sampleWebhookStatusEnum,
} from './enum.js'

// ========================================
// Projects Table
// ========================================

export const sampleProjects = pgTable(
  'sample_projects',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // ユーザー関連
    userId: uuid('user_id').notNull(),

    // プロジェクト基本情報
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: sampleProjectStatusEnum('status').notNull().default('active'),

    // プロジェクト詳細
    tags: jsonb('tags').notNull().default(sql`'[]'::jsonb`),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),

    // 日付関連
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),

    // 優先度と進捗
    priority: integer('priority').notNull().default(0), // 0=低, 1=中, 2=高
    progress: integer('progress').notNull().default(0), // 0-100%

    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => {
    return {
      userIdIdx: index('sample_projects_user_id_idx').on(table.userId),
      statusIdx: index('sample_projects_status_idx').on(table.status),
      createdAtIdx: index('sample_projects_created_at_idx').on(table.createdAt),
    }
  }
)

// ========================================
// Subscriptions Table
// ========================================

export const sampleSubscriptions = pgTable(
  'sample_subscriptions',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // ユーザー関連
    userId: uuid('user_id').notNull(),

    // Stripe関連ID
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull().unique(),
    stripePriceId: varchar('stripe_price_id', { length: 255 }).notNull(),
    stripeProductId: varchar('stripe_product_id', { length: 255 }).notNull(),

    // プラン情報
    plan: samplePlanEnum('plan').notNull(),
    status: sampleSubscriptionStatusEnum('status').notNull(),
    billingCycle: sampleBillingCycleEnum('billing_cycle').notNull(),

    // 請求期間
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),

    // 解約関連
    cancelAt: timestamp('cancel_at'),
    canceledAt: timestamp('canceled_at'),
    cancelReason: text('cancel_reason'),

    // 試用期間
    trialStart: timestamp('trial_start'),
    trialEnd: timestamp('trial_end'),

    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('sample_subscriptions_user_id_idx').on(table.userId),
      statusIdx: index('sample_subscriptions_status_idx').on(table.status),
      planIdx: index('sample_subscriptions_plan_idx').on(table.plan),
    }
  }
)

// ========================================
// Payment History Table
// ========================================

export const samplePaymentHistory = pgTable(
  'sample_payment_history',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // ユーザー関連
    userId: uuid('user_id').notNull(),

    // サブスクリプション関連
    subscriptionId: uuid('subscription_id').references(() => sampleSubscriptions.id, {
      onDelete: 'cascade',
    }),

    // Stripe関連
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }).notNull().unique(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    stripeChargeId: varchar('stripe_charge_id', { length: 255 }),

    // 支払い情報
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('jpy'),
    status: samplePaymentStatusEnum('status').notNull(),
    description: text('description'),

    // 請求期間
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),

    // 支払い方法
    paymentMethod: varchar('payment_method', { length: 50 }),
    last4: varchar('last4', { length: 4 }),
    brand: varchar('brand', { length: 20 }),

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
      userIdIdx: index('sample_payment_history_user_id_idx').on(table.userId),
      subscriptionIdIdx: index('sample_payment_history_subscription_id_idx').on(
        table.subscriptionId
      ),
      statusIdx: index('sample_payment_history_status_idx').on(table.status),
      createdAtIdx: index('sample_payment_history_created_at_idx').on(table.createdAt),
    }
  }
)

// ========================================
// Webhook Events Table
// ========================================

export const sampleWebhookEvents = pgTable(
  'sample_webhook_events',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // Stripe Event情報
    stripeEventId: varchar('stripe_event_id', { length: 255 }).notNull().unique(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    apiVersion: varchar('api_version', { length: 50 }),

    // ペイロード
    payload: jsonb('payload').notNull(),
    objectId: varchar('object_id', { length: 255 }),
    objectType: varchar('object_type', { length: 50 }),

    // 処理状態
    status: sampleWebhookStatusEnum('status').notNull().default('pending'),
    processedAt: timestamp('processed_at'),
    failureReason: text('failure_reason'),
    retryCount: integer('retry_count').default(0),

    // タイムスタンプ
    eventCreatedAt: timestamp('event_created_at').notNull(),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      eventTypeIdx: index('sample_webhook_events_event_type_idx').on(table.eventType),
      statusIdx: index('sample_webhook_events_status_idx').on(table.status),
      objectIdIdx: index('sample_webhook_events_object_id_idx').on(table.objectId),
    }
  }
)

// ========================================
// Plan Limits Table
// ========================================

export const samplePlanLimits = pgTable('sample_plan_limits', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

  // プラン名
  plan: samplePlanEnum('plan').notNull().unique(),

  // 制限値
  monthlyUsageLimit: integer('monthly_usage_limit').notNull(),
  projectsLimit: integer('projects_limit').notNull(),
  membersPerProjectLimit: integer('members_per_project_limit').notNull(),

  // 機能フラグ
  features: jsonb('features').notNull().default(sql`'{}'::jsonb`),

  // 料金情報（表示用）
  monthlyPrice: integer('monthly_price').notNull(),
  yearlyPrice: integer('yearly_price').notNull(),
  displayOrder: integer('display_order').notNull().default(0),

  // タイムスタンプ
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
})

// ========================================
// Relations
// ========================================

export const sampleProjectsRelations = relations(sampleProjects, ({ one }) => ({
  // プロジェクトとユーザーの関係を定義可能
}))

export const sampleSubscriptionsRelations = relations(sampleSubscriptions, ({ many }) => ({
  paymentHistory: many(samplePaymentHistory),
}))

export const samplePaymentHistoryRelations = relations(samplePaymentHistory, ({ one }) => ({
  subscription: one(sampleSubscriptions, {
    fields: [samplePaymentHistory.subscriptionId],
    references: [sampleSubscriptions.id],
  }),
}))
