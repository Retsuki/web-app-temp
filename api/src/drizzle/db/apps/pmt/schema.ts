import { relations, sql } from "drizzle-orm";
import {
	boolean,
	check,
	decimal,
	index,
	integer,
	jsonb,
	numeric,
	pgTable,
	text,
	timestamp,
	unique,
	uuid,
	varchar,
} from "drizzle-orm/pg-core";
import { profiles } from "../../shared/common-schema.js";
import {
	contentGenerationScheduleTypeEnum,
	intervalUnitEnum,
	POST_TARGET_STATUSES,
	platformEnum,
	postScheduleTypeEnum,
	postTargetStatusEnum,
} from "./enum.js";

// プロジェクトテーブル
export const pmtProjects = pgTable("pmt_projects", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// プロジェクト名
	name: varchar("name", { length: 255 }).notNull(),

	// プロジェクト説明
	description: text("description"),

	// オーナーユーザー
	ownerId: uuid("owner_id")
		.notNull()
		.references(() => profiles.userId, { onDelete: "cascade" }),

	// プロジェクトステータス
	status: varchar("status", { length: 50 }).notNull().default("active"), // active, archived, deleted

	// 設定完了フラグ
	isSetupComplete: boolean("is_setup_complete").notNull().default(false),

	// 通知設定
	notifications: jsonb("notifications")
		.$type<{
			contentGenerationComplete?: boolean;
			contentGenerationError?: boolean;
			postError?: boolean;
			postComplete?: boolean;
		}>()
		.notNull()
		.default({
			contentGenerationComplete: true,
			contentGenerationError: true,
			postError: true,
			postComplete: true,
		}),

	// タイムスタンプ
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
	deletedAt: timestamp("deleted_at"),
});

// SNSアカウントテーブル
export const pmtSnsAccounts = pgTable("pmt_sns_accounts", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// ユーザー関連
	userId: uuid("user_id").references(() => profiles.userId, {
		onDelete: "cascade",
	}),

	// プロジェクト関連
	projectId: uuid("project_id")
		.notNull()
		.references(() => pmtProjects.id, { onDelete: "cascade" }),

	// SNSプラットフォーム
	platform: varchar("platform", { length: 50 }).notNull(), // instagram, x, facebook, tiktok, youtube

	// アカウント情報
	accountName: varchar("account_name", { length: 255 }).notNull(),
	accountId: varchar("account_id", { length: 255 }),

	// 認証情報（暗号化して保存）
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	tokenExpiresAt: timestamp("token_expires_at"),

	// アカウントステータス
	status: varchar("status", { length: 50 }).notNull().default("active"), // active, inactive, error

	// 追加情報（OAuth状態、プラットフォーム固有のデータなど）
	additionalInformation: jsonb("additional_information").notNull().default({}),

	// タイムスタンプ
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// 投稿テーブル
export const pmtPosts = pgTable(
	"pmt_posts",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// プロジェクト関連
		projectId: uuid("project_id")
			.notNull()
			.references(() => pmtProjects.id, { onDelete: "cascade" }),

		// 投稿タイトル
		title: varchar("title", { length: 255 }),

		// 投稿内容
		content: text("content").notNull(),
		mediaUrl: text("media_url"), // 画像・動画URL

		// AIエージェント関連（投稿の自動生成に使用）
		agentId: uuid("agent_id").references(() => pmtAiAgents.id, {
			onDelete: "set null",
		}), // AIエージェントID
		scenarioId: varchar("scenario_id", { length: 255 }), // シナリオID
		formatId: uuid("format_id").references(() => pmtFormats.id, {
			onDelete: "set null",
		}),

		// 投稿タイプ
		postType: varchar("post_type", { length: 50 }).notNull().default("manual"), // manual, automated

		// 全体ステータス管理
		status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, scheduled, publishing, published, partial, failed, cancelled

		// スケジュール情報
		scheduledAt: timestamp("scheduled_at", { withTimezone: true }), // 投稿予定日時（全体の基準時刻）
		timezone: varchar("timezone", { length: 100 }), // タイムゾーン（表示用）

		// サマリー情報（post_targetsの集計）
		publishedCount: integer("published_count").default(0), // 投稿成功したSNS数
		failedCount: integer("failed_count").default(0), // 投稿失敗したSNS数
		totalTargets: integer("total_targets").default(0), // 投稿対象SNS総数

		// 予約投稿時に選択されたSNSアカウントID
		selectedSnsAccountIds: jsonb("selected_sns_account_ids")
			.default([])
			.$type<string[]>(),

		// 追加情報（YouTube Analytics等のプラットフォーム固有のデータ）
		additionalInformation: jsonb("additional_information")
			.notNull()
			.default({}),
		// additionalInformationの構造例:
		// {
		//   youtube: {
		//     averageViewDuration: 120, // 平均視聴時間（秒）
		//     averageViewPercentage: 75.5, // 視聴完了率（%）
		//     estimatedMinutesWatched: 1500, // 推定視聴時間（分）
		//     subscribersGained: 10, // 獲得登録者数
		//     subscribersLost: 2, // 失った登録者数
		//     lastAnalyticsUpdate: "2024-03-20T10:00:00Z" // 最終更新日時
		//   },
		//   tiktok: {
		//     tiktokVideoId: "7123456789123456789", // TikTok動画ID
		//     shareUrl: "https://www.tiktok.com/@username/video/7123456789123456789", // シェアURL
		//     coverImageUrl: "https://...", // サムネイル画像URL
		//     privacyLevel: "PUBLIC_TO_EVERYONE", // プライバシー設定
		//     duetDisabled: false, // デュエット無効化
		//     stitchDisabled: false, // スティッチ無効化
		//     commentDisabled: false, // コメント無効化
		//     viewCount: 10000, // 再生数
		//     shareCount: 500, // シェア数
		//     commentCount: 200, // コメント数
		//     likeCount: 1500, // いいね数
		//     lastAnalyticsUpdate: "2024-03-20T10:00:00Z" // 最終更新日時
		//   }
		// }

		// コンテンツ生成関連（Cloud Tasks対応）
		contentGenerationStatus: varchar("content_generation_status", {
			length: 50,
		}),
		// 'waiting' | 'generating_agents' | 'generating_scenes' | 'generating_images' |
		// 'generating_audio' | 'generating_music' | 'creating_video' | 'completed' | 'failed'

		// 生成結果
		generationResult: jsonb("generation_result").$type<{
			videoUrl?: string;
			thumbnailUrl?: string;
			duration?: number;
			error?: string;
			failedStep?: string;
		}>(),

		// Cloud TaskのID（デバッグ・監視用）
		taskId: varchar("task_id", { length: 255 }),

		// タイムスタンプ
		createdAt: timestamp("created_at").default(sql`now()`).notNull(),
		updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
	},
	(table) => ({
		// インデックス
		statusIdx: index("posts_status_idx").on(table.status),
		scheduledAtIdx: index("posts_scheduled_at_idx").on(table.scheduledAt),
		statusScheduledIdx: index("posts_status_scheduled_idx").on(
			table.status,
			table.scheduledAt,
		),
		contentGenerationStatusIdx: index("posts_content_generation_status_idx").on(
			table.contentGenerationStatus,
		),
	}),
);

// フォーマットテーブル
export const pmtFormats = pgTable("pmt_formats", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// フォーマット名
	name: varchar("name", { length: 255 }).notNull(),

	// フォーマット説明
	description: text("description"),

	// 画像URL
	imageUrl: text("image_url"),

	// フォーマットタイプ
	type: varchar("type", { length: 50 }),

	// フォーマットグレード
	grade: varchar("grade", { length: 50 }).notNull().default("basic"),

	// タイムスタンプ
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// AIエージェントテーブル
export const pmtAiAgents = pgTable(
	"pmt_ai_agents",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// プロジェクト関連
		projectId: uuid("project_id")
			.notNull()
			.references(() => pmtProjects.id, { onDelete: "cascade" }),

		// エージェント名
		name: varchar("name", { length: 255 }).notNull(),

		// エージェントの方向性
		direction: varchar("direction", { length: 255 }).notNull(),
		overview: text("overview"),

		// 画像URL
		imageUrl: text("image_url"),

		// アバター設定
		avatarSeed: varchar("avatar_seed", { length: 255 }),
		avatarStyle: varchar("avatar_style", { length: 50 }).default("pixel-art"),
		avatarBgColor: varchar("avatar_bg_color", { length: 50 }).default(
			"#FFFFFF",
		),
		videoAvatarImageUrl: text("video_avatar_image_url"),

		// 性別
		gender: varchar("gender", { length: 50 }),

		// 言語設定 (ja, en など) - profilesのlanguageから継承
		language: varchar("language", { length: 10 }).default("en"),

		// フォーマット配列（一時的にJSONBを使用）
		formats: jsonb("formats").notNull().default([]),

		// 自動投稿有効フラグ
		isAutoPostActive: boolean("is_auto_post_active").notNull().default(false),

		// コンテンツ生成から投稿までの遅延日数（0は即日投稿、1は翌日投稿など）
		postDelayDays: integer("post_delay_days").notNull().default(0),

		// 動画の長さ（秒）- 最大60秒
		duration: integer("duration").notNull().default(60),

		// 注意事項
		cautions: text("cautions"),

		// タイムスタンプ
		createdAt: timestamp("created_at").default(sql`now()`).notNull(),
		updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
	},
	(table) => ({
		// durationカラムの制約: 1秒以上60秒以下
		durationCheck: check(
			"duration_check",
			sql`${table.duration} >= 1 AND ${table.duration} <= 60`,
		),
	}),
);

// AIエージェントとSNSアカウントの関連テーブル
export const pmtAiAgentSnsAccounts = pgTable(
	"pmt_ai_agent_sns_accounts",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// AIエージェント関連
		agentId: uuid("agent_id")
			.notNull()
			.references(() => pmtAiAgents.id, { onDelete: "cascade" }),

		// SNSアカウント関連
		snsAccountId: uuid("sns_account_id")
			.notNull()
			.references(() => pmtSnsAccounts.id, { onDelete: "cascade" }),

		// プラットフォーム（冗長性のため保存）
		platform: platformEnum("platform").notNull(),

		// アクティブフラグ
		isActive: boolean("is_active").default(true).notNull(),

		// 優先度（同じプラットフォームで複数アカウントがある場合）
		priority: integer("priority").default(0).notNull(),

		// タイムスタンプ
		createdAt: timestamp("created_at").default(sql`now()`).notNull(),
		updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
	},
	(table) => ({
		// ユニーク制約（1つのエージェントに対して同じSNSアカウントは1つまで）
		uniqueAgentAccount: unique("pmt_ai_agent_sns_accounts_unique").on(
			table.agentId,
			table.snsAccountId,
		),
		// インデックス
		agentIdx: index("pmt_ai_agent_sns_accounts_agent_idx").on(table.agentId),
		accountIdx: index("pmt_ai_agent_sns_accounts_account_idx").on(
			table.snsAccountId,
		),
		platformIdx: index("pmt_ai_agent_sns_accounts_platform_idx").on(
			table.platform,
		),
		activeIdx: index("pmt_ai_agent_sns_accounts_active_idx").on(table.isActive),
	}),
);

// AIエージェントのコンテンツ生成スケジュールテーブル
export const pmtAiAgentContentGenerationSchedules = pgTable(
	"pmt_ai_agent_content_generation_schedules",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// AIエージェント関連
		agentId: uuid("agent_id")
			.notNull()
			.references(() => pmtAiAgents.id, { onDelete: "cascade" }),

		// スケジュールタイプ
		scheduleType: contentGenerationScheduleTypeEnum("schedule_type").notNull(),

		// 基本時刻設定
		timeOfDay: varchar("time_of_day", { length: 8 }).notNull(), // HH:MM:SS形式
		timeZone: varchar("time_zone", { length: 100 })
			.notNull()
			.default("Asia/Tokyo"),

		// 曜日指定（WEEKLY用）
		dayOfWeek: integer("day_of_week"), // 0-6 (0=日曜日)

		// 月次指定（MONTHLY用）
		dayOfMonth: integer("day_of_month"), // 1-31
		weekOfMonth: integer("week_of_month"), // 1-5 (第N週)

		// インターバル指定（INTERVAL用）
		intervalValue: integer("interval_value"), // 間隔の値
		intervalUnit: intervalUnitEnum("interval_unit"), // HOURS, DAYS, WEEKS, MONTHS

		// 特定日指定（SPECIFIC_DATES用）
		specificDate: varchar("specific_date", { length: 10 }), // YYYY-MM-DD

		// 実行管理
		nextGenerationAt: timestamp("next_generation_at", { withTimezone: true }),
		lastGeneratedAt: timestamp("last_generated_at", { withTimezone: true }),

		// 有効/無効フラグ
		isActive: boolean("is_active").default(true).notNull(),

		// タイムスタンプ
		createdAt: timestamp("created_at").default(sql`now()`).notNull(),
		updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
	},
	(table) => ({
		// インデックス
		activeSchedulesIdx: index("ai_agent_content_gen_schedules_active_idx").on(
			table.isActive,
			table.nextGenerationAt,
		),
		agentSchedulesIdx: index("ai_agent_content_gen_schedules_agent_idx").on(
			table.agentId,
			table.scheduleType,
		),
		dayOfWeekIdx: index("ai_agent_content_gen_schedules_dow_idx").on(
			table.dayOfWeek,
			table.timeOfDay,
		),
		dayOfMonthIdx: index("ai_agent_content_gen_schedules_dom_idx").on(
			table.dayOfMonth,
			table.timeOfDay,
		),
	}),
);

// AIエージェントの投稿スケジュールテーブル
export const pmtAiAgentPostSchedules = pgTable(
	"pmt_ai_agent_post_schedules",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// AIエージェント関連
		agentId: uuid("agent_id")
			.notNull()
			.references(() => pmtAiAgents.id, { onDelete: "cascade" }),

		// スケジュールタイプ
		type: postScheduleTypeEnum("type").notNull(),

		// 時刻設定（HH:mm:ss形式）
		timeOfDay: varchar("time_of_day", { length: 8 }).notNull(),

		// タイムゾーン
		timeZone: text("time_zone").notNull().default("Asia/Tokyo"),

		// タイプ別設定フィールド
		dayOfWeek: integer("day_of_week"), // WEEKLY用 (0-6, 0=日曜)
		dayOfMonth: integer("day_of_month"), // MONTHLY_DATE用 (1-31)
		weekOfMonth: integer("week_of_month"), // MONTHLY_NTH用 (1-5)
		intervalValue: integer("interval_value"), // INTERVAL用
		intervalUnit: intervalUnitEnum("interval_unit"), // HOURS, DAYS, WEEKS, MONTHS

		// 実行管理
		nextRunAt: timestamp("next_run_at", { withTimezone: true }).notNull(),
		lastRunAt: timestamp("last_run_at", { withTimezone: true }),

		// ステータス
		active: boolean("active").default(true).notNull(),

		// タイムスタンプ
		createdAt: timestamp("created_at").default(sql`now()`).notNull(),
		updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
	},
	(table) => ({
		// インデックス
		activeNextIdx: index("ai_agent_post_schedules_active_next_idx").on(
			table.active,
			table.nextRunAt,
		),
		uniqAgentNextIdx: unique("ai_agent_post_schedules_uniq_agent_next_idx").on(
			table.agentId,
			table.nextRunAt,
		),
	}),
);

// シーンテーブル（各シーンを個別レコードとして管理）
export const pmtScenes = pgTable("pmt_scenes", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// プロジェクト関連
	projectId: uuid("project_id")
		.notNull()
		.references(() => pmtProjects.id, { onDelete: "cascade" }),

	// AIエージェント関連
	agentId: uuid("agent_id").references(() => pmtAiAgents.id, {
		onDelete: "cascade",
	}),

	// 投稿関連（このシーンが属する投稿）
	postId: uuid("post_id")
		.notNull()
		.references(() => pmtPosts.id, { onDelete: "cascade" }),

	// シーン番号（同一投稿内での順序）
	sceneNumber: integer("scene_number").notNull(),

	// シーンの時間（秒）
	duration: integer("duration").notNull(),

	// ビジュアル要素を配列として管理
	visuals: jsonb("visuals").notNull().default([]),
	// visualsの構造例:
	// [
	//   {
	//     id: "visual-1",
	//     url: "https://...",
	//     description: "商品の正面写真",
	//     order: 1,
	//     type: "image", // image, video
	//     duration: 3 // 表示時間（秒）
	//   },
	//   {
	//     id: "visual-2",
	//     url: "https://...",
	//     description: "使用シーンの写真",
	//     order: 2,
	//     type: "image",
	//     duration: 2
	//   }
	// ]

	// 字幕要素を配列として管理
	subtitles: jsonb("subtitles").notNull().default([]),
	// subtitlesの構造例:
	// [
	//   {
	//     id: "subtitle-1",
	//     text: "期間限定50%OFF",
	//     position: {
	//       x: 50,        // 画面上の位置（%）
	//       y: 20,        // 画面上の位置（%）
	//       align: "center" // left, center, right
	//     },
	//     style: {
	//       fontSize: 48,
	//       fontWeight: "bold",
	//       color: "#FF0000",
	//       backgroundColor: "rgba(255,255,255,0.8)",
	//       fontFamily: "Noto Sans JP",
	//       textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
	//       padding: "10px 20px",
	//       borderRadius: "8px"
	//     },
	//     animation: {
	//       type: "fadeIn",     // fadeIn, slideIn, bounce, typewriter
	//       duration: 500,      // ミリ秒
	//       delay: 0,          // ミリ秒
	//       direction: "left"   // slideInの場合の方向
	//     },
	//     timing: {
	//       startTime: 0,      // 表示開始時間（秒）
	//       endTime: 3,        // 表示終了時間（秒）
	//       duration: 3        // または duration で指定
	//     }
	//   }
	// ]

	// 音声要素を配列として管理
	audios: jsonb("audios").notNull().default([]),
	// audiosの構造例:
	// [
	//   {
	//     id: "audio-1",
	//     url: "https://...",
	//     type: "narration", // narration, bgm, effect
	//     text: "ナレーションテキスト", // type=narrationの場合
	//     startTime: 0,
	//     endTime: 5
	//   }
	// ]

	// トランジション（fade, slide, slide-out等）
	transition: varchar("transition", { length: 50 }),

	// ステータス
	status: varchar("status", { length: 50 }).notNull().default("active"), // active, used, archived

	// タイムスタンプ
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// サブスクリプションテーブル
export const pmtSubscriptions = pgTable(
	"pmt_subscriptions",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// ユーザー関連
		userId: uuid("user_id")
			.notNull()
			.references(() => profiles.userId, { onDelete: "cascade" }),

		// Stripe関連ID
		stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 })
			.notNull()
			.unique(),
		stripePriceId: varchar("stripe_price_id", { length: 255 }).notNull(),
		stripeProductId: varchar("stripe_product_id", { length: 255 }).notNull(),

		// プラン情報
		plan: varchar("plan", { length: 50 }).notNull(), // standard, pro
		status: varchar("status", { length: 50 }).notNull(), // active, past_due, canceled, unpaid
		billingCycle: varchar("billing_cycle", { length: 20 }).notNull(), // monthly, yearly

		// 次回プラン情報（ダウングレード時に使用）
		nextPlan: varchar("next_plan", { length: 50 }), // 次回適用されるプラン
		nextBillingCycle: varchar("next_billing_cycle", { length: 20 }), // 次回の請求サイクル
		planChangeAt: timestamp("plan_change_at"), // プラン変更予定日

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
	},
	(table) => {
		return {
			userIdIdx: index("subscriptions_user_id_idx").on(table.userId),
			statusIdx: index("subscriptions_status_idx").on(table.status),
			planIdx: index("subscriptions_plan_idx").on(table.plan),
		};
	},
);

// 支払い履歴テーブル
export const pmtPaymentHistory = pgTable(
	"pmt_payment_history",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// ユーザー関連
		userId: uuid("user_id")
			.notNull()
			.references(() => profiles.userId, { onDelete: "cascade" }),

		// サブスクリプション関連
		subscriptionId: uuid("subscription_id").references(
			() => pmtSubscriptions.id,
			{
				onDelete: "set null",
			},
		),

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

// Webhookイベント履歴テーブル
export const pmtWebhookEvents = pgTable(
	"pmt_webhook_events",
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
export const pmtPlanLimits = pgTable("pmt_plan_limits", {
	id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

	// プラン名
	plan: varchar("plan", { length: 50 }).notNull().unique(), // free, standard, pro

	// 制限値
	monthlyCredits: integer("monthly_credits").notNull(), // 月間付与クレジット数
	projectsLimit: integer("projects_limit").notNull(), // プロジェクト数上限
	policiesPerProjectLimit: integer("policies_per_project_limit").notNull(), // プロジェクトあたりのポリシー数上限
	snsAccountsLimit: integer("sns_accounts_limit").notNull(), // ユーザーあたりの接続可能SNSアカウント数上限

	// 機能フラグ
	features: jsonb("features").notNull().default(sql`'{}'::jsonb`), // { "api_access": true, "export": true, ... }

	// 料金情報（表示用）
	monthlyPrice: numeric("monthly_price", { precision: 10, scale: 2 }).notNull(), // 月額料金（円）
	yearlyPrice: numeric("yearly_price", { precision: 10, scale: 2 }).notNull(), // 年額料金（円）
	displayOrder: integer("display_order").notNull().default(0), // 表示順

	// タイムスタンプ
	createdAt: timestamp("created_at").default(sql`now()`).notNull(),
	updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
});

// OAuth認証状態管理テーブル（全プロバイダー共通）
export const pmtOauthStates = pgTable(
	"pmt_oauth_states",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// 認証状態の識別子
		state: varchar("state", { length: 255 }).notNull().unique(),

		// プロバイダー情報
		provider: varchar("provider", { length: 50 }).notNull(), // 'youtube', 'tiktok', 'instagram', etc.

		// ユーザー・プロジェクト関連
		userId: uuid("user_id")
			.notNull()
			.references(() => profiles.userId, { onDelete: "cascade" }),
		projectId: uuid("project_id")
			.notNull()
			.references(() => pmtProjects.id, { onDelete: "cascade" }),

		// PKCE認証用（OAuth 2.0）
		codeVerifier: varchar("code_verifier", { length: 128 }),

		// リダイレクト先
		redirectUri: text("redirect_uri").notNull(),

		// プロバイダー固有のメタデータ
		metadata: jsonb("metadata").notNull().default({}),
		// metadataの例:
		// YouTube: { agentId: "uuid" }
		// TikTok: { scope: "user.info.basic,video.publish" }
		// Instagram: { permissions: ["instagram_basic", "instagram_content_publish"] }

		// タイムスタンプ
		createdAt: timestamp("created_at", { withTimezone: true }).default(
			sql`CURRENT_TIMESTAMP`,
		),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
	},
	(table) => {
		return {
			// インデックス
			stateIdx: index("idx_oauth_states_state").on(table.state),
			providerIdx: index("idx_oauth_states_provider").on(table.provider),
			userProjectIdx: index("idx_oauth_states_user_project").on(
				table.userId,
				table.projectId,
			),
			expiresAtIdx: index("idx_oauth_states_expires_at").on(table.expiresAt),
		};
	},
);

// 投稿ターゲット中間テーブル（投稿とSNSアカウントの多対多関係）
export const pmtPostTargets = pgTable(
	"pmt_post_targets",
	{
		id: uuid("id").default(sql`gen_random_uuid()`).primaryKey(),

		// 投稿ID
		postId: uuid("post_id")
			.notNull()
			.references(() => pmtPosts.id, { onDelete: "cascade" }),

		// SNSアカウントID
		snsAccountId: uuid("sns_account_id")
			.notNull()
			.references(() => pmtSnsAccounts.id, { onDelete: "cascade" }),

		// 個別ステータス管理
		status: postTargetStatusEnum("status")
			.notNull()
			.default(POST_TARGET_STATUSES.PENDING),

		// 投稿タイミング
		scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
		postedAt: timestamp("posted_at", { withTimezone: true }),

		// SNSプラットフォーム情報
		externalPostId: varchar("external_post_id", { length: 255 }),
		postUrl: text("post_url"),

		// エラー情報
		errorMessage: text("error_message"),
		retryCount: integer("retry_count").default(0),
		lastRetryAt: timestamp("last_retry_at", { withTimezone: true }),

		// エンゲージメント指標
		likes: integer("likes").default(0),
		shares: integer("shares").default(0),
		comments: integer("comments").default(0),
		views: integer("views").default(0),
		reach: integer("reach").default(0),
		impressions: integer("impressions").default(0),
		engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),

		// メタ情報（プラットフォーム固有のデータ）
		metadata: jsonb("metadata"),

		// タイムスタンプ
		createdAt: timestamp("created_at", { withTimezone: true }).default(
			sql`CURRENT_TIMESTAMP`,
		),
		updatedAt: timestamp("updated_at", { withTimezone: true }).default(
			sql`CURRENT_TIMESTAMP`,
		),
	},
	(table) => {
		return {
			// 同一投稿・同一アカウントの重複を防ぐ
			uniquePostAccount: unique("unique_post_account").on(
				table.postId,
				table.snsAccountId,
			),
			postIdIdx: index("idx_post_targets_post_id").on(table.postId),
			snsAccountIdIdx: index("idx_post_targets_sns_account_id").on(
				table.snsAccountId,
			),
			statusIdx: index("idx_post_targets_status").on(table.status),
			scheduledAtIdx: index("idx_post_targets_scheduled_at").on(
				table.scheduledAt,
			),
			statusScheduledIdx: index("idx_post_targets_status_scheduled").on(
				table.status,
				table.scheduledAt,
			),
		};
	},
);

// リレーション定義
export const profilesRelations = relations(profiles, ({ many }) => ({
	subscriptions: many(pmtSubscriptions),
	paymentHistory: many(pmtPaymentHistory),
	ownedProjects: many(pmtProjects),
}));

export const pmtProjectsRelations = relations(pmtProjects, ({ one, many }) => ({
	owner: one(profiles, {
		fields: [pmtProjects.ownerId],
		references: [profiles.userId],
	}),
	snsAccounts: many(pmtSnsAccounts),
	posts: many(pmtPosts),
	aiAgents: many(pmtAiAgents),
	scenes: many(pmtScenes),
}));

export const pmtSnsAccountsRelations = relations(
	pmtSnsAccounts,
	({ one, many }) => ({
		project: one(pmtProjects, {
			fields: [pmtSnsAccounts.projectId],
			references: [pmtProjects.id],
		}),
		posts: many(pmtPosts),
		postTargets: many(pmtPostTargets),
		agentConnections: many(pmtAiAgentSnsAccounts),
	}),
);

export const pmtPostsRelations = relations(pmtPosts, ({ one, many }) => ({
	project: one(pmtProjects, {
		fields: [pmtPosts.projectId],
		references: [pmtProjects.id],
	}),
	// snsAccountリレーションを削除（postsはsnsAccountIdを持たない新アーキテクチャ）
	// 代わりにpostTargetsを通じてSNSアカウントと関連付け
	aiAgent: one(pmtAiAgents, {
		fields: [pmtPosts.agentId],
		references: [pmtAiAgents.id],
	}),
	scenes: many(pmtScenes),
	postTargets: many(pmtPostTargets),
}));

export const pmtFormatsRelations = relations(pmtFormats, ({ many }) => ({
	// 将来的にフォーマットに関連するリレーションを追加可能
}));

export const pmtAiAgentsRelations = relations(pmtAiAgents, ({ one, many }) => ({
	project: one(pmtProjects, {
		fields: [pmtAiAgents.projectId],
		references: [pmtProjects.id],
	}),
	scenes: many(pmtScenes),
	postSchedules: many(pmtAiAgentPostSchedules),
	contentGenerationSchedules: many(pmtAiAgentContentGenerationSchedules),
	snsAccounts: many(pmtAiAgentSnsAccounts),
}));

export const pmtAiAgentContentGenerationSchedulesRelations = relations(
	pmtAiAgentContentGenerationSchedules,
	({ one }) => ({
		agent: one(pmtAiAgents, {
			fields: [pmtAiAgentContentGenerationSchedules.agentId],
			references: [pmtAiAgents.id],
		}),
	}),
);

export const pmtAiAgentPostSchedulesRelations = relations(
	pmtAiAgentPostSchedules,
	({ one }) => ({
		agent: one(pmtAiAgents, {
			fields: [pmtAiAgentPostSchedules.agentId],
			references: [pmtAiAgents.id],
		}),
	}),
);

export const pmtScenesRelations = relations(pmtScenes, ({ one }) => ({
	project: one(pmtProjects, {
		fields: [pmtScenes.projectId],
		references: [pmtProjects.id],
	}),
	agent: one(pmtAiAgents, {
		fields: [pmtScenes.agentId],
		references: [pmtAiAgents.id],
	}),
	post: one(pmtPosts, {
		fields: [pmtScenes.postId],
		references: [pmtPosts.id],
	}),
}));

export const pmtSubscriptionsRelations = relations(
	pmtSubscriptions,
	({ one, many }) => ({
		profile: one(profiles, {
			fields: [pmtSubscriptions.userId],
			references: [profiles.userId],
		}),
		paymentHistory: many(pmtPaymentHistory),
	}),
);

export const pmtPaymentHistoryRelations = relations(
	pmtPaymentHistory,
	({ one }) => ({
		profile: one(profiles, {
			fields: [pmtPaymentHistory.userId],
			references: [profiles.userId],
		}),
		subscription: one(pmtSubscriptions, {
			fields: [pmtPaymentHistory.subscriptionId],
			references: [pmtSubscriptions.id],
		}),
	}),
);

export const pmtOauthStatesRelations = relations(pmtOauthStates, ({ one }) => ({
	profile: one(profiles, {
		fields: [pmtOauthStates.userId],
		references: [profiles.userId],
	}),
	project: one(pmtProjects, {
		fields: [pmtOauthStates.projectId],
		references: [pmtProjects.id],
	}),
}));

export const pmtPostTargetsRelations = relations(pmtPostTargets, ({ one }) => ({
	post: one(pmtPosts, {
		fields: [pmtPostTargets.postId],
		references: [pmtPosts.id],
	}),
	snsAccount: one(pmtSnsAccounts, {
		fields: [pmtPostTargets.snsAccountId],
		references: [pmtSnsAccounts.id],
	}),
}));

export const pmtAiAgentSnsAccountsRelations = relations(
	pmtAiAgentSnsAccounts,
	({ one }) => ({
		agent: one(pmtAiAgents, {
			fields: [pmtAiAgentSnsAccounts.agentId],
			references: [pmtAiAgents.id],
		}),
		snsAccount: one(pmtSnsAccounts, {
			fields: [pmtAiAgentSnsAccounts.snsAccountId],
			references: [pmtSnsAccounts.id],
		}),
	}),
);
