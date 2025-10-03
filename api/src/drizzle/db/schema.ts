import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgEnum,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

export const PLAN = { FREE: "free", STARTER: "starter", PRO: "pro" } as const;
export type Plan = (typeof PLAN)[keyof typeof PLAN];
export const planEnum = pgEnum(
	"plan",
	Object.values(PLAN) as [Plan, ...Plan[]],
);

// Enums
export const LANGUAGE = { JA: "ja", EN: "en" } as const;
export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];
export const languageEnum = pgEnum(
	"language",
	Object.values(LANGUAGE) as [Language, ...Language[]],
);

// プラン
export const plans = pgTable("plans", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	slug: varchar("slug", { length: 50 }).notNull().unique(),
	name: varchar("name", { length: 100 }).notNull(),
	description: text("description"),
	metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
	isActive: boolean("is_active").default(true).notNull(),
	displayOrder: integer("display_order").default(0).notNull(),
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// プロフィール
export const profiles = pgTable("profiles", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	userId: uuid("user_id").notNull().unique(),
	nickname: varchar("nickname", { length: 50 }).notNull(),
	email: varchar("email", { length: 255 }).notNull().unique(),
	createdAt: timestamp("created_at").default(sql`now()`),
	updatedAt: timestamp("updated_at").default(sql`now()`),
	deletedAt: timestamp("deleted_at"),
});

// ユーザー設定

export const userSettings = pgTable("user_settings", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => profiles.userId, { onDelete: "cascade" })
		.unique(),
	language: languageEnum("language").default(LANGUAGE.JA),
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// プロジェクト
export const projects = pgTable(
	"projects",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => profiles.userId, { onDelete: "cascade" }),
		name: varchar("name", { length: 255 }).notNull(),
		description: text("description"),
		status: varchar("status", { length: 50 }).notNull().default("active"),
		tags: jsonb("tags").notNull().default(sql`'[]'::jsonb`),
		metadata: jsonb("metadata").notNull().default(sql`'{}'::jsonb`),
		startDate: timestamp("start_date"),
		endDate: timestamp("end_date"),
		priority: integer("priority").notNull().default(0),
		progress: integer("progress").notNull().default(0),
		createdAt: timestamp("created_at").default(sql`now()`).notNull(),
		updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
		deletedAt: timestamp("deleted_at"),
	},
	(table) => {
		return {
			userIdIdx: index("projects_user_id_idx").on(table.userId),
			statusIdx: index("projects_status_idx").on(table.status),
			createdAtIdx: index("projects_created_at_idx").on(table.createdAt),
		};
	},
);

// サブスクリプション
export const subscriptions = pgTable(
	"subscriptions",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => profiles.userId, { onDelete: "cascade" }),
		stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 })
			.notNull()
			.unique(),
		stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
		stripeProductId: varchar("stripe_product_id", { length: 255 }).notNull(),
		planId: uuid("plan_id")
			.notNull()
			.references(() => plans.id),
		status: varchar("status", { length: 50 }).notNull(),
		billingCycle: varchar("billing_cycle", { length: 20 }).notNull(),
		currentPeriodStart: timestamp("current_period_start").notNull(),
		currentPeriodEnd: timestamp("current_period_end").notNull(),
		cancelAt: timestamp("cancel_at"),
		canceledAt: timestamp("canceled_at"),
		cancelReason: text("cancel_reason"),
		trialStart: timestamp("trial_start"),
		trialEnd: timestamp("trial_end"),
		createdAt: timestamp("created_at").default(sql`now()`).notNull(),
		updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
	},
	(table) => {
		return {
			userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
			statusIdx: index("subscriptions_status_idx").on(table.status),
			planIdx: index("subscriptions_plan_id_idx").on(table.planId),
		};
	},
);

// 支払い履歴
export const paymentHistory = pgTable(
	"payment_history",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		userId: uuid("user_id")
			.notNull()
			.references(() => profiles.userId, { onDelete: "cascade" }),
		subscriptionId: uuid("subscription_id").references(() => subscriptions.id, {
			onDelete: "cascade",
		}),
		stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 })
			.notNull()
			.unique(),
		stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
		stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
		amount: integer("amount").notNull(),
		currency: varchar("currency", { length: 10 }).notNull().default("jpy"),
		status: varchar("status", { length: 50 }).notNull(),
		description: text("description"),
		periodStart: timestamp("period_start"),
		periodEnd: timestamp("period_end"),
		paymentMethod: varchar("payment_method", { length: 50 }),
		last4: varchar("last4", { length: 4 }),
		brand: varchar("brand", { length: 20 }),
		refundedAmount: integer("refunded_amount").default(0),
		refundedAt: timestamp("refunded_at"),
		refundReason: text("refund_reason"),
		paidAt: timestamp("paid_at"),
		failedAt: timestamp("failed_at"),
		createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	},
	(table) => {
		return {
			userIdIdx: index("payment_history_user_id_idx").on(table.userId),
			subscriptionIdIdx: index("payment_history_subscription_id_idx").on(
				table.subscriptionId,
			),
			statusIdx: index("payment_history_status_idx").on(table.status),
			createdAtIdx: index("payment_history_created_at_idx").on(table.createdAt),
		};
	},
);

// Webhookイベント
export const webhookEvents = pgTable(
	"webhook_events",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
		stripeEventId: varchar("stripe_event_id", { length: 255 })
			.notNull()
			.unique(),
		eventType: varchar("event_type", { length: 100 }).notNull(),
		apiVersion: varchar("api_version", { length: 50 }),
		payload: jsonb("payload").notNull(),
		objectId: varchar("object_id", { length: 255 }),
		objectType: varchar("object_type", { length: 50 }),
		status: varchar("status", { length: 20 }).notNull().default("pending"),
		processedAt: timestamp("processed_at"),
		failureReason: text("failure_reason"),
		retryCount: integer("retry_count").default(0),
		eventCreatedAt: timestamp("event_created_at").notNull(),
		createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	},
	(table) => {
		return {
			eventTypeIdx: index("webhook_events_event_type_idx").on(table.eventType),
			statusIdx: index("webhook_events_status_idx").on(table.status),
			objectIdIdx: index("webhook_events_object_id_idx").on(table.objectId),
		};
	},
);

// 請求用顧客
export const billingCustomers = pgTable("billing_customers", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),
	userId: uuid("user_id")
		.notNull()
		.references(() => profiles.userId, { onDelete: "cascade" })
		.unique(),
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 })
		.notNull()
		.unique(),
	planId: uuid("plan_id")
		.notNull()
		.references(() => plans.id),
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// Relations
export const profilesRelations = relations(profiles, ({ many }) => ({
	subscriptions: many(subscriptions),
	paymentHistory: many(paymentHistory),
}));

export const subscriptionsRelations = relations(
	subscriptions,
	({ one, many }) => ({
		profile: one(profiles, {
			fields: [subscriptions.userId],
			references: [profiles.userId],
		}),
		paymentHistory: many(paymentHistory),
		plan: one(plans, {
			fields: [subscriptions.planId],
			references: [plans.id],
		}),
	}),
);

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
	profile: one(profiles, {
		fields: [paymentHistory.userId],
		references: [profiles.userId],
	}),
	subscription: one(subscriptions, {
		fields: [paymentHistory.subscriptionId],
		references: [subscriptions.id],
	}),
}));

export const projectsRelations = relations(projects, ({ one }) => ({
	profile: one(profiles, {
		fields: [projects.userId],
		references: [profiles.userId],
	}),
}));

export const billingCustomersRelations = relations(
	billingCustomers,
	({ one }) => ({
		profile: one(profiles, {
			fields: [billingCustomers.userId],
			references: [profiles.userId],
		}),
		plan: one(plans, {
			fields: [billingCustomers.planId],
			references: [plans.id],
		}),
	}),
);

export const plansRelations = relations(plans, ({ many }) => ({
	subscriptions: many(subscriptions),
	billingCustomers: many(billingCustomers),
}));

export const userSettingsRelations = relations(userSettings, ({ one }) => ({
	profile: one(profiles, {
		fields: [userSettings.userId],
		references: [profiles.userId],
	}),
}));
