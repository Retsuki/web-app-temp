import { relations, sql } from 'drizzle-orm'
import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { profiles } from '../../../shared/common-schema.js'
import {
  CAMPAIGN_STATUS,
  campaignStatusEnum,
  campaignTypeEnum,
  meterUnitEnum,
  omSubscriptionStatusEnum,
  transactionTypeEnum,
} from '../enum.js'

// プロジェクトテーブル（開発者のプロジェクト）
export const omProjects = pgTable(
  'om_projects',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // 開発者情報（profilesテーブルのidを参照）
    userId: uuid('user_id')
      .notNull()
      .references(() => {
        const { profiles } = require('../../../shared/common-schema')
        return profiles.id
      }),

    // プロジェクト情報
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),

    // APIキー（暗号化して保存）
    apiKey: varchar('api_key', { length: 255 }).notNull().unique(),
    secretKey: text('secret_key').notNull(), // 暗号化必須

    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('om_projects_user_id_idx').on(table.userId),
      apiKeyIdx: index('om_projects_api_key_idx').on(table.apiKey),
    }
  }
)

// メーター定義テーブル
export const omMeters = pgTable(
  'om_meters',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // プロジェクト関連
    projectId: uuid('project_id')
      .notNull()
      .references(() => omProjects.id, { onDelete: 'cascade' }),

    // メーター情報
    meterId: varchar('meter_id', { length: 100 }).notNull(), // 開発者が設定するID
    name: varchar('name', { length: 255 }).notNull(),
    category: varchar('category', { length: 100 }),
    unit: meterUnitEnum('unit').notNull(),

    // クレジット設定
    creditsPerUnit: decimal('credits_per_unit', {
      precision: 10,
      scale: 2,
    }).notNull(),

    // 制限設定
    dailyLimit: integer('daily_limit'),
    weeklyLimit: integer('weekly_limit'),
    monthlyLimit: integer('monthly_limit'),

    // 無料枠
    freeCredits: integer('free_credits').default(0),

    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      projectMeterUnique: unique('om_meters_project_meter_unique').on(
        table.projectId,
        table.meterId
      ),
      projectIdIdx: index('om_meters_project_id_idx').on(table.projectId),
    }
  }
)

// エンドユーザーテーブル（開発者のアプリのユーザー）
export const omEndUsers = pgTable(
  'om_end_users',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // プロジェクト関連
    projectId: uuid('project_id')
      .notNull()
      .references(() => omProjects.id, { onDelete: 'cascade' }),

    // ユーザー識別子（開発者側のユーザーID）
    externalUserId: varchar('external_user_id', { length: 255 }).notNull(),

    // メタデータ
    metadata: jsonb('metadata').$type<Record<string, any>>(),

    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      projectUserUnique: unique('om_end_users_project_user_unique').on(
        table.projectId,
        table.externalUserId
      ),
      projectIdIdx: index('om_end_users_project_id_idx').on(table.projectId),
    }
  }
)

// クレジット残高テーブル
export const omCreditBalances = pgTable(
  'om_credit_balances',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    endUserId: uuid('end_user_id')
      .notNull()
      .references(() => omEndUsers.id, { onDelete: 'cascade' }),
    balance: integer('balance').notNull().default(0),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      endUserIdIdx: index('om_credit_balances_end_user_id_idx').on(table.endUserId),
    }
  }
)

// クレジット取引履歴テーブル
export const omCreditTransactions = pgTable(
  'om_credit_transactions',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    endUserId: uuid('end_user_id')
      .notNull()
      .references(() => omEndUsers.id, { onDelete: 'cascade' }),
    amount: integer('amount').notNull(),
    type: transactionTypeEnum('type').notNull(), // 'allocation', 'consumption', 'expiry', 'refund'
    description: text('description'),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    meterId: uuid('meter_id').references(() => omMeters.id),
    campaignId: uuid('campaign_id'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      endUserIdIdx: index('om_credit_transactions_end_user_id_idx').on(table.endUserId),
      createdAtIdx: index('om_credit_transactions_created_at_idx').on(table.createdAt),
    }
  }
)

// メーターイベントテーブル
export const omMeterEvents = pgTable(
  'om_meter_events',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    meterId: uuid('meter_id')
      .notNull()
      .references(() => omMeters.id, { onDelete: 'cascade' }),
    endUserId: uuid('end_user_id')
      .notNull()
      .references(() => omEndUsers.id, { onDelete: 'cascade' }),
    units: integer('units').notNull(),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    meterIdIdx: index('om_meter_events_meter_id_idx').on(table.meterId),
    endUserIdIdx: index('om_meter_events_end_user_id_idx').on(table.endUserId),
    createdAtIdx: index('om_meter_events_created_at_idx').on(table.createdAt),
  })
)

// キャンペーンテーブル
export const omCampaigns = pgTable(
  'om_campaigns',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => omProjects.id, { onDelete: 'cascade' }),
    type: campaignTypeEnum('type').notNull(), // 'coupon', 'automatic', 'referral', 'first_time'
    status: campaignStatusEnum('status').notNull().default(CAMPAIGN_STATUS.DRAFT),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    projectIdIdx: index('om_campaigns_project_id_idx').on(table.projectId),
    statusIdx: index('om_campaigns_status_idx').on(table.status),
    createdAtIdx: index('om_campaigns_created_at_idx').on(table.createdAt),
  })
)

// クーポンテーブル
export const omCoupons = pgTable(
  'om_coupons',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    campaignId: uuid('campaign_id')
      .notNull()
      .references(() => omCampaigns.id, { onDelete: 'cascade' }),
    code: varchar('code', { length: 50 }).notNull().unique(),
    discountAmount: integer('discount_amount'),
    usageLimit: integer('usage_limit'),
    usedCount: integer('used_count').default(0),
    expiresAt: timestamp('expires_at'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    campaignIdIdx: index('om_coupons_campaign_id_idx').on(table.campaignId),
    codeIdx: index('om_coupons_code_idx').on(table.code),
  })
)

// 使用量集計テーブル
export const omUsageAggregations = pgTable(
  'om_usage_aggregations',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => omProjects.id, { onDelete: 'cascade' }),
    date: timestamp('date').notNull(),
    totalUsage: integer('total_usage').notNull().default(0),
    peakUsage: integer('peak_usage').notNull().default(0),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    projectIdIdx: index('om_usage_aggregations_project_id_idx').on(table.projectId),
    dateIdx: index('om_usage_aggregations_date_idx').on(table.date),
  })
)

// サブスクリプション管理テーブル
// ========================================

// サブスクリプションテーブル
export const omSubscriptions = pgTable(
  'om_subscriptions',
  {
    subscriptionId: uuid('subscription_id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => {
        const { profiles } = require('../../../shared/common-schema')
        return profiles.id
      }),
    stripeSubscriptionId: varchar('stripe_subscription_id', {
      length: 255,
    }).unique(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
    priceId: varchar('price_id', { length: 255 }),
    status: omSubscriptionStatusEnum('status').notNull(),
    currentPeriodStart: timestamp('current_period_start'),
    currentPeriodEnd: timestamp('current_period_end'),
    canceledAt: timestamp('canceled_at'),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    userIdIdx: index('om_subscriptions_user_id_idx').on(table.userId),
    stripeSubscriptionIdIdx: index('om_subscriptions_stripe_subscription_id_idx').on(
      table.stripeSubscriptionId
    ),
    statusIdx: index('om_subscriptions_status_idx').on(table.status),
  })
)

// 支払い履歴テーブル
export const omPaymentHistory = pgTable(
  'om_payment_history',
  {
    paymentId: uuid('payment_id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => {
        const { profiles } = require('../../../shared/common-schema')
        return profiles.id
      }),
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 3 }).notNull(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', {
      length: 255,
    }).unique(),
    status: varchar('status', { length: 50 }).notNull(),
    description: text('description'),
    metadata: jsonb('metadata').$type<Record<string, any>>(),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    userIdIdx: index('om_payment_history_user_id_idx').on(table.userId),
    stripePaymentIntentIdIdx: index('om_payment_history_stripe_payment_intent_id_idx').on(
      table.stripePaymentIntentId
    ),
    createdAtIdx: index('om_payment_history_created_at_idx').on(table.createdAt),
  })
)

// Webhookイベントテーブル
export const omWebhookEvents = pgTable(
  'om_webhook_events',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    stripeWebhookEventId: varchar('stripe_webhook_event_id', {
      length: 255,
    }).unique(),
    type: varchar('type', { length: 255 }).notNull(),
    data: jsonb('data').notNull(),
    processed: boolean('processed').default(false).notNull(),
    error: text('error'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    processedAt: timestamp('processed_at'),
  },
  (table) => ({
    stripeWebhookEventIdIdx: index('om_webhook_events_stripe_webhook_event_id_idx').on(
      table.stripeWebhookEventId
    ),
    typeIdx: index('om_webhook_events_type_idx').on(table.type),
    processedIdx: index('om_webhook_events_processed_idx').on(table.processed),
    createdAtIdx: index('om_webhook_events_created_at_idx').on(table.createdAt),
  })
)

// プラン制限テーブル
export const omPlanLimits = pgTable(
  'om_plan_limits',
  {
    planId: varchar('plan_id', { length: 50 }).primaryKey(),
    feature: varchar('feature', { length: 100 }).notNull(),
    limitValue: integer('limit_value'),
    unlimitedFlag: boolean('unlimited_flag').default(false),
    description: text('description'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    planFeatureUnique: unique('om_plan_limits_plan_feature_unique').on(table.planId, table.feature),
  })
)

// ========================================
// リレーション定義
// ========================================

// OMプロジェクトのリレーション
export const omProjectsRelations = relations(omProjects, ({ many }) => ({
  meters: many(omMeters),
  endUsers: many(omEndUsers),
  campaigns: many(omCampaigns),
  aggregations: many(omUsageAggregations),
}))

// メーターのリレーション
export const omMetersRelations = relations(omMeters, ({ one, many }) => ({
  project: one(omProjects, {
    fields: [omMeters.projectId],
    references: [omProjects.id],
  }),
  events: many(omMeterEvents),
}))

// エンドユーザーのリレーション
export const omEndUsersRelations = relations(omEndUsers, ({ one, many }) => ({
  project: one(omProjects, {
    fields: [omEndUsers.projectId],
    references: [omProjects.id],
  }),
  creditBalance: one(omCreditBalances),
  transactions: many(omCreditTransactions),
  meterEvents: many(omMeterEvents),
}))

// クレジット残高のリレーション
export const omCreditBalancesRelations = relations(omCreditBalances, ({ one }) => ({
  endUser: one(omEndUsers, {
    fields: [omCreditBalances.endUserId],
    references: [omEndUsers.id],
  }),
}))

// クレジット取引のリレーション
export const omCreditTransactionsRelations = relations(omCreditTransactions, ({ one }) => ({
  endUser: one(omEndUsers, {
    fields: [omCreditTransactions.endUserId],
    references: [omEndUsers.id],
  }),
  meter: one(omMeters, {
    fields: [omCreditTransactions.meterId],
    references: [omMeters.id],
  }),
  campaign: one(omCampaigns, {
    fields: [omCreditTransactions.campaignId],
    references: [omCampaigns.id],
  }),
}))

// メーターイベントのリレーション
export const omMeterEventsRelations = relations(omMeterEvents, ({ one }) => ({
  meter: one(omMeters, {
    fields: [omMeterEvents.meterId],
    references: [omMeters.id],
  }),
  endUser: one(omEndUsers, {
    fields: [omMeterEvents.endUserId],
    references: [omEndUsers.id],
  }),
}))

// キャンペーンのリレーション
export const omCampaignsRelations = relations(omCampaigns, ({ one, many }) => ({
  project: one(omProjects, {
    fields: [omCampaigns.projectId],
    references: [omProjects.id],
  }),
  coupons: many(omCoupons),
  transactions: many(omCreditTransactions),
}))

// クーポンのリレーション
export const omCouponsRelations = relations(omCoupons, ({ one }) => ({
  campaign: one(omCampaigns, {
    fields: [omCoupons.campaignId],
    references: [omCampaigns.id],
  }),
}))

// 使用量集計のリレーション
export const omUsageAggregationsRelations = relations(omUsageAggregations, ({ one }) => ({
  project: one(omProjects, {
    fields: [omUsageAggregations.projectId],
    references: [omProjects.id],
  }),
}))

// サブスクリプションのリレーション
export const omSubscriptionsRelations = relations(omSubscriptions, ({ one }) => ({
  user: one(profiles, {
    fields: [omSubscriptions.userId],
    references: [profiles.id],
  }),
}))

// 支払い履歴のリレーション
export const omPaymentHistoryRelations = relations(omPaymentHistory, ({ one }) => ({
  user: one(profiles, {
    fields: [omPaymentHistory.userId],
    references: [profiles.id],
  }),
}))

