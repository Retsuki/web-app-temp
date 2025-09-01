// Drizzle-Kit friendly version of sample schema (no .js extensions)
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

// Inline enum definitions for drizzle-kit to generate CREATE TYPE first
export const samplePlanEnum = pgEnum('sample_plan', ['free', 'indie', 'pro'])
export const sampleProjectStatusEnum = pgEnum('sample_project_status', [
  'active',
  'archived',
  'completed',
])
export const sampleSubscriptionStatusEnum = pgEnum('sample_subscription_status', [
  'active',
  'past_due',
  'canceled',
  'unpaid',
])
export const samplePaymentStatusEnum = pgEnum('sample_payment_status', [
  'paid',
  'failed',
  'pending',
  'refunded',
])
export const sampleWebhookStatusEnum = pgEnum('sample_webhook_status', [
  'pending',
  'processed',
  'failed',
])
export const sampleBillingCycleEnum = pgEnum('sample_billing_cycle', ['monthly', 'yearly'])

export const sampleProjects = pgTable(
  'sample_projects',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: uuid('user_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    status: sampleProjectStatusEnum('status').notNull().default('active'),
    tags: jsonb('tags').notNull().default(sql`'[]'::jsonb`),
    metadata: jsonb('metadata').notNull().default(sql`'{}'::jsonb`),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    priority: integer('priority').notNull().default(0),
    progress: integer('progress').notNull().default(0),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => ({
    userIdIdx: index('sample_projects_user_id_idx').on(table.userId),
    statusIdx: index('sample_projects_status_idx').on(table.status),
    createdAtIdx: index('sample_projects_created_at_idx').on(table.createdAt),
  })
)

export const sampleSubscriptions = pgTable(
  'sample_subscriptions',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: uuid('user_id').notNull(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).notNull().unique(),
    stripePriceId: varchar('stripe_price_id', { length: 255 }).notNull(),
    stripeProductId: varchar('stripe_product_id', { length: 255 }).notNull(),
    plan: samplePlanEnum('plan').notNull(),
    status: sampleSubscriptionStatusEnum('status').notNull(),
    billingCycle: sampleBillingCycleEnum('billing_cycle').notNull(),
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),
    cancelAt: timestamp('cancel_at'),
    canceledAt: timestamp('canceled_at'),
    cancelReason: text('cancel_reason'),
    trialStart: timestamp('trial_start'),
    trialEnd: timestamp('trial_end'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    userIdIdx: index('sample_subscriptions_user_id_idx').on(table.userId),
    statusIdx: index('sample_subscriptions_status_idx').on(table.status),
    planIdx: index('sample_subscriptions_plan_idx').on(table.plan),
  })
)

export const samplePaymentHistory = pgTable(
  'sample_payment_history',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    userId: uuid('user_id').notNull(),
    subscriptionId: uuid('subscription_id').references(() => sampleSubscriptions.id, {
      onDelete: 'cascade',
    }),
    stripeInvoiceId: varchar('stripe_invoice_id', { length: 255 }).notNull().unique(),
    stripePaymentIntentId: varchar('stripe_payment_intent_id', { length: 255 }),
    stripeChargeId: varchar('stripe_charge_id', { length: 255 }),
    amount: integer('amount').notNull(),
    currency: varchar('currency', { length: 10 }).notNull().default('jpy'),
    status: samplePaymentStatusEnum('status').notNull(),
    description: text('description'),
    periodStart: timestamp('period_start'),
    periodEnd: timestamp('period_end'),
    paymentMethod: varchar('payment_method', { length: 50 }),
    last4: varchar('last4', { length: 4 }),
    brand: varchar('brand', { length: 20 }),
    refundedAmount: integer('refunded_amount').default(0),
    refundedAt: timestamp('refunded_at'),
    refundReason: text('refund_reason'),
    paidAt: timestamp('paid_at'),
    failedAt: timestamp('failed_at'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    userIdIdx: index('sample_payment_history_user_id_idx').on(table.userId),
    subscriptionIdIdx: index('sample_payment_history_subscription_id_idx').on(table.subscriptionId),
    statusIdx: index('sample_payment_history_status_idx').on(table.status),
    createdAtIdx: index('sample_payment_history_created_at_idx').on(table.createdAt),
  })
)

export const sampleWebhookEvents = pgTable(
  'sample_webhook_events',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    stripeEventId: varchar('stripe_event_id', { length: 255 }).notNull().unique(),
    eventType: varchar('event_type', { length: 100 }).notNull(),
    apiVersion: varchar('api_version', { length: 50 }),
    payload: jsonb('payload').notNull(),
    objectId: varchar('object_id', { length: 255 }),
    objectType: varchar('object_type', { length: 50 }),
    status: sampleWebhookStatusEnum('status').notNull().default('pending'),
    processedAt: timestamp('processed_at'),
    failureReason: text('failure_reason'),
    retryCount: integer('retry_count').default(0),
    eventCreatedAt: timestamp('event_created_at').notNull(),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    eventTypeIdx: index('sample_webhook_events_event_type_idx').on(table.eventType),
    statusIdx: index('sample_webhook_events_status_idx').on(table.status),
    objectIdIdx: index('sample_webhook_events_object_id_idx').on(table.objectId),
  })
)

export const samplePlanLimits = pgTable('sample_plan_limits', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  plan: samplePlanEnum('plan').notNull().unique(),
  monthlyUsageLimit: integer('monthly_usage_limit').notNull(),
  projectsLimit: integer('projects_limit').notNull(),
  membersPerProjectLimit: integer('members_per_project_limit').notNull(),
  features: jsonb('features').notNull().default(sql`'{}'::jsonb`),
  monthlyPrice: integer('monthly_price').notNull(),
  yearlyPrice: integer('yearly_price').notNull(),
  displayOrder: integer('display_order').notNull().default(0),
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
})

export const sampleProjectsRelations = relations(sampleProjects, () => ({}))
export const sampleSubscriptionsRelations = relations(sampleSubscriptions, ({ many }) => ({
  paymentHistory: many(samplePaymentHistory),
}))
export const samplePaymentHistoryRelations = relations(samplePaymentHistory, ({ one }) => ({
  subscription: one(sampleSubscriptions, {
    fields: [samplePaymentHistory.subscriptionId],
    references: [sampleSubscriptions.id],
  }),
}))
