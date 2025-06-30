import { relations, sql } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	jsonb,
	pgTable,
	text,
	timestamp,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";

// ユーザープロフィールテーブル
export const profiles = pgTable("profiles", {
	// ユーザーを一意に識別するUUID
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// Supabase AuthのユーザーID (auth.usersのUUIDに対応)
	userId: uuid("user_id").notNull().unique(),

	// ニックネーム
	nickname: varchar("nickname", { length: 50 }).notNull(),

	// メールアドレス
	email: varchar("email", { length: 255 }).notNull().unique(),

	// 作成日時
	createdAt: timestamp("created_at").default(sql`now()`),

	// 更新日時
	updatedAt: timestamp("updated_at").default(sql`now()`),

	// 削除日時（論理削除）
	deletedAt: timestamp("deleted_at"),

	// Stripe関連
	stripeCustomerId: varchar("stripe_customer_id", { length: 255 }).unique(),
	plan: varchar("plan", { length: 50 }).notNull().default("free"), // free, indie, pro
});

// サブスクリプションテーブル
export const subscriptions = pgTable("subscriptions", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// ユーザー関連
	userId: uuid("user_id")
		.notNull()
		.references(() => profiles.userId),

	// Stripe関連ID
	stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 })
		.notNull()
		.unique(),
	stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
	stripeProductId: varchar("stripe_product_id", { length: 255 }).notNull(),

	// プラン情報
	plan: varchar("plan", { length: 50 }).notNull(), // indie, pro
	status: varchar("status", { length: 50 }).notNull(), // active, past_due, canceled, unpaid
	billingCycle: varchar("billing_cycle", { length: 20 }).notNull(), // monthly, yearly

	// 請求期間
	currentPeriodStart: timestamp("current_period_start").notNull(),
	currentPeriodEnd: timestamp("current_period_end").notNull(),

	// 解約関連
	cancelAt: timestamp("cancel_at"), // 解約予定日
	canceledAt: timestamp("canceled_at"), // 解約実行日
	cancelReason: text("cancel_reason"), // 解約理由

	// 試用期間
	trialStart: timestamp("trial_start"),
	trialEnd: timestamp("trial_end"),

	// タイムスタンプ
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// 支払い履歴テーブル
export const paymentHistory = pgTable("payment_history", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// ユーザー関連
	userId: uuid("user_id")
		.notNull()
		.references(() => profiles.userId),

	// サブスクリプション関連
	subscriptionId: uuid("subscription_id").references(() => subscriptions.id),

	// Stripe関連
	stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 })
		.notNull()
		.unique(),
	stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
	stripeChargeId: varchar("stripe_charge_id", { length: 255 }),

	// 支払い情報
	amount: integer("amount").notNull(), // 金額（円）
	currency: varchar("currency", { length: 3 }).notNull().default("jpy"),
	status: varchar("status", { length: 50 }).notNull(), // paid, failed, pending, refunded
	description: text("description"),

	// 請求期間
	periodStart: timestamp("period_start"),
	periodEnd: timestamp("period_end"),

	// 支払い方法
	paymentMethod: varchar("payment_method", { length: 50 }), // card, bank_transfer
	last4: varchar("last4", { length: 4 }), // カード下4桁
	brand: varchar("brand", { length: 20 }), // visa, mastercard, amex等

	// 返金情報
	refundedAmount: integer("refunded_amount").default(0),
	refundedAt: timestamp("refunded_at"),
	refundReason: text("refund_reason"),

	// タイムスタンプ
	paidAt: timestamp("paid_at"),
	failedAt: timestamp("failed_at"),
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Webhookイベント履歴テーブル
export const webhookEvents = pgTable(
	"webhook_events",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// Stripe Event情報
		stripeEventId: varchar("stripe_event_id", { length: 255 })
			.notNull()
			.unique(),
		eventType: varchar("event_type", { length: 100 }).notNull(), // customer.subscription.created等
		apiVersion: varchar("api_version", { length: 50 }),

		// ペイロード
		payload: jsonb("payload").notNull(),
		objectId: varchar("object_id", { length: 255 }), // 関連オブジェクトID（sub_xxx, in_xxx等）
		objectType: varchar("object_type", { length: 50 }), // subscription, invoice, customer等

		// 処理状態
		status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, processed, failed
		processedAt: timestamp("processed_at"),
		failureReason: text("failure_reason"),
		retryCount: integer("retry_count").default(0),

		// タイムスタンプ
		eventCreatedAt: timestamp("event_created_at").notNull(), // Stripeでのイベント作成時刻
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

// プラン制限管理テーブル
export const planLimits = pgTable("plan_limits", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// プラン名
	plan: varchar("plan", { length: 50 }).notNull().unique(), // free, indie, pro

	// 制限値
	monthlyScansLimit: integer("monthly_scans_limit").notNull(), // 月間スキャン回数上限
	projectsLimit: integer("projects_limit").notNull(), // プロジェクト数上限
	membersPerProjectLimit: integer("members_per_project_limit").notNull(), // プロジェクトあたりのメンバー数上限

	// 機能フラグ
	features: jsonb("features").notNull().default("{}"), // { "api_access": true, "export": true, ... }

	// 料金情報（表示用）
	monthlyPrice: integer("monthly_price").notNull(), // 月額料金（円）
	yearlyPrice: integer("yearly_price").notNull(), // 年額料金（円）
	displayOrder: integer("display_order").notNull().default(0), // 表示順

	// タイムスタンプ
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// インデックス
export const subscriptionIndexes = [
	index("subscriptions_user_id_idx").on(subscriptions.userId),
	index("subscriptions_status_idx").on(subscriptions.status),
	index("subscriptions_plan_idx").on(subscriptions.plan),
];

export const paymentHistoryIndexes = [
	index("payment_history_user_id_idx").on(paymentHistory.userId),
	index("payment_history_subscription_id_idx").on(
		paymentHistory.subscriptionId,
	),
	index("payment_history_status_idx").on(paymentHistory.status),
	index("payment_history_created_at_idx").on(paymentHistory.createdAt),
];

// リレーション定義
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
