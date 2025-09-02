import { relations, sql } from 'drizzle-orm'
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
} from 'drizzle-orm/pg-core'
import { profiles } from '../../../shared/common-schema.js'
import {
  contentGenerationScheduleTypeEnum,
  intervalUnitEnum,
  POST_TARGET_STATUSES,
  platformEnum,
  postScheduleTypeEnum,
  postTargetStatusEnum,
} from '../enum.js'

// プロジェクトテーブル
export const pmtProjects = pgTable('pmt_projects', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

  // プロジェクト名
  name: varchar('name', { length: 255 }).notNull(),

  // プロジェクト説明
  description: text('description'),

  // オーナーユーザー
  ownerId: uuid('owner_id')
    .notNull()
    .references(() => profiles.userId, { onDelete: 'cascade' }),

  // プロジェクトステータス
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, archived, deleted

  // 設定完了フラグ
  isSetupComplete: boolean('is_setup_complete').notNull().default(false),

  // 通知設定
  notifications: jsonb('notifications')
    .$type<{
      contentGenerationComplete?: boolean
      contentGenerationError?: boolean
      postError?: boolean
      postComplete?: boolean
    }>()
    .notNull()
    .default({
      contentGenerationComplete: true,
      contentGenerationError: true,
      postError: true,
      postComplete: true,
    }),

  // タイムスタンプ
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  deletedAt: timestamp('deleted_at'),
})

// SNSアカウントテーブル
export const pmtSnsAccounts = pgTable('pmt_sns_accounts', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

  // ユーザー関連
  userId: uuid('user_id').references(() => profiles.userId, {
    onDelete: 'cascade',
  }),

  // プロジェクト関連
  projectId: uuid('project_id')
    .notNull()
    .references(() => pmtProjects.id, { onDelete: 'cascade' }),

  // SNSプラットフォーム
  platform: varchar('platform', { length: 50 }).notNull(), // instagram, x, facebook, tiktok, youtube

  // アカウント情報
  accountName: varchar('account_name', { length: 255 }).notNull(),
  accountId: varchar('account_id', { length: 255 }),

  // 認証情報（暗号化して保存）
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  tokenExpiresAt: timestamp('token_expires_at'),

  // アカウントステータス
  status: varchar('status', { length: 50 }).notNull().default('active'), // active, inactive, error

  // 追加情報（OAuth状態、プラットフォーム固有のデータなど）
  additionalInformation: jsonb('additional_information').notNull().default({}),

  // タイムスタンプ
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
})

// 投稿テーブル
export const pmtPosts = pgTable(
  'pmt_posts',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),

    // プロジェクト関連
    projectId: uuid('project_id')
      .notNull()
      .references(() => pmtProjects.id, { onDelete: 'cascade' }),

    // 投稿タイトル
    title: varchar('title', { length: 255 }),

    // 投稿内容
    content: text('content'),

    // 画像URL（画像生成やアップロード機能と連携）
    imageUrl: varchar('image_url', { length: 1024 }),

    // 投稿ステータス
    status: varchar('status', { length: 50 }).notNull().default('draft'), // draft, scheduled, published, failed, canceled

    // メタデータ（アクセシビリティ、テキスト代替、AI生成情報など）
    metadata: jsonb('metadata')
      .$type<{
        altText?: string
        aiModel?: string
        aiPrompt?: string
        revision?: number
      }>()
      .notNull()
      .default({}),

    // 生成コスト（AI生成時のトークン使用量等をコスト換算）
    generationCost: numeric('generation_cost', { precision: 10, scale: 2 }),

    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    projectIdIdx: index('pmt_posts_project_id_idx').on(table.projectId),
    statusIdx: index('pmt_posts_status_idx').on(table.status),
    createdAtIdx: index('pmt_posts_created_at_idx').on(table.createdAt),
  })
)

// 投稿予約テーブル
export const pmtPostSchedules = pgTable(
  'pmt_post_schedules',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => pmtPosts.id, { onDelete: 'cascade' }),
    type: postScheduleTypeEnum('type').notNull(), // one_time, recurring
    scheduledAt: timestamp('scheduled_at'),
    intervalValue: integer('interval_value'),
    intervalUnit: intervalUnitEnum('interval_unit'), // minute, hour, day, week, month
    timezone: varchar('timezone', { length: 50 }).default('UTC'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    postIdIdx: index('pmt_post_schedules_post_id_idx').on(table.postId),
    typeIdx: index('pmt_post_schedules_type_idx').on(table.type),
  })
)

// 投稿ターゲットテーブル（どのSNSに投稿するか）
export const pmtPostTargets = pgTable(
  'pmt_post_targets',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => pmtPosts.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => pmtSnsAccounts.id, { onDelete: 'cascade' }),
    status: postTargetStatusEnum('status').notNull().default(POST_TARGET_STATUSES.PENDING),
    errorMessage: text('error_message'),
    publishedAt: timestamp('published_at'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    postIdIdx: index('pmt_post_targets_post_id_idx').on(table.postId),
    accountIdIdx: index('pmt_post_targets_account_id_idx').on(table.accountId),
    statusIdx: index('pmt_post_targets_status_idx').on(table.status),
  })
)

// 投稿エンゲージメントテーブル
export const pmtPostEngagements = pgTable(
  'pmt_post_engagements',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    postId: uuid('post_id')
      .notNull()
      .references(() => pmtPosts.id, { onDelete: 'cascade' }),
    likes: integer('likes').notNull().default(0),
    comments: integer('comments').notNull().default(0),
    shares: integer('shares').notNull().default(0),
    impressions: integer('impressions').notNull().default(0),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    postIdIdx: index('pmt_post_engagements_post_id_idx').on(table.postId),
    createdAtIdx: index('pmt_post_engagements_created_at_idx').on(table.createdAt),
  })
)

// コンテンツ生成キュー
export const pmtContentGenerationQueue = pgTable(
  'pmt_content_generation_queue',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    projectId: uuid('project_id')
      .notNull()
      .references(() => pmtProjects.id, { onDelete: 'cascade' }),
    status: varchar('status', { length: 50 }).notNull().default('queued'), // queued, processing, completed, failed
    priority: integer('priority').notNull().default(0),
    scheduledAt: timestamp('scheduled_at'),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    projectIdIdx: index('pmt_content_generation_queue_project_id_idx').on(table.projectId),
    statusIdx: index('pmt_content_generation_queue_status_idx').on(table.status),
    scheduledAtIdx: index('pmt_content_generation_queue_scheduled_at_idx').on(table.scheduledAt),
  })
)

// コンテンツ生成履歴
export const pmtContentGenerationHistory = pgTable(
  'pmt_content_generation_history',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    queueId: uuid('queue_id')
      .notNull()
      .references(() => pmtContentGenerationQueue.id, { onDelete: 'cascade' }),
    prompt: text('prompt').notNull(),
    model: varchar('model', { length: 50 }),
    inputTokens: integer('input_tokens'),
    outputTokens: integer('output_tokens'),
    cost: numeric('cost', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => ({
    queueIdIdx: index('pmt_content_generation_history_queue_id_idx').on(table.queueId),
  })
)

// ========================================
// リレーション定義
// ========================================

export const pmtProjectsRelations = relations(pmtProjects, ({ many }) => ({
  posts: many(pmtPosts),
  accounts: many(pmtSnsAccounts),
  generationQueue: many(pmtContentGenerationQueue),
}))

export const pmtSnsAccountsRelations = relations(pmtSnsAccounts, ({ one, many }) => ({
  project: one(pmtProjects, {
    fields: [pmtSnsAccounts.projectId],
    references: [pmtProjects.id],
  }),
  postTargets: many(pmtPostTargets),
}))

export const pmtPostsRelations = relations(pmtPosts, ({ one, many }) => ({
  project: one(pmtProjects, {
    fields: [pmtPosts.projectId],
    references: [pmtProjects.id],
  }),
  schedule: one(pmtPostSchedules, {
    fields: [pmtPostSchedules.postId],
    references: [pmtPosts.id],
  }),
  targets: many(pmtPostTargets),
  engagements: many(pmtPostEngagements),
}))

export const pmtPostSchedulesRelations = relations(pmtPostSchedules, ({ one }) => ({
  post: one(pmtPosts, {
    fields: [pmtPostSchedules.postId],
    references: [pmtPosts.id],
  }),
}))

export const pmtPostTargetsRelations = relations(pmtPostTargets, ({ one }) => ({
  post: one(pmtPosts, {
    fields: [pmtPostTargets.postId],
    references: [pmtPosts.id],
  }),
  account: one(pmtSnsAccounts, {
    fields: [pmtPostTargets.accountId],
    references: [pmtSnsAccounts.id],
  }),
}))

export const pmtPostEngagementsRelations = relations(pmtPostEngagements, ({ one }) => ({
  post: one(pmtPosts, {
    fields: [pmtPostEngagements.postId],
    references: [pmtPosts.id],
  }),
}))

export const pmtContentGenerationQueueRelations = relations(
  pmtContentGenerationQueue,
  ({ one, many }) => ({
    project: one(pmtProjects, {
      fields: [pmtContentGenerationQueue.projectId],
      references: [pmtProjects.id],
    }),
    history: many(pmtContentGenerationHistory),
  })
)

export const pmtContentGenerationHistoryRelations = relations(
  pmtContentGenerationHistory,
  ({ one }) => ({
    queue: one(pmtContentGenerationQueue, {
      fields: [pmtContentGenerationHistory.queueId],
      references: [pmtContentGenerationQueue.id],
    }),
  })
)

