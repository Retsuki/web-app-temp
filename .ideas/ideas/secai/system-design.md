# SecAI システム設計書

## 概要
SecAIは、個人開発者やスタートアップ向けの自動セキュリティチェックサービスです。AIを活用して低コストで何度でもセキュリティ診断を実施でき、セキュリティ企業への依頼前の初期診断として利用できます。

## アーキテクチャ概要

### 技術スタック
- **Frontend**: Next.js 15.3.4 (App Router) + TypeScript
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **Backend**: Hono + TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: Drizzle ORM
- **Authentication**: Supabase Auth (Email or Google OAuth)
- **Payment**: Stripe
- **API Documentation**: OpenAPI + orval
- **Queue/Job**: Cloud Tasks
- **Container**: Cloud Run
- **CI/CD**: Cloud Build
- **Code Quality**: Biome 

### システム構成図
```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Next.js App   │────▶│   Hono API       │────▶│   Supabase DB   │
│  (Frontend)     │     │  (Backend)       │     │   PostgreSQL    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                        │                         │
        │                        │                         │
        ▼                        ▼                         │
┌─────────────────┐     ┌──────────────────┐              │
│ Supabase Auth   │     │   Cloud Tasks    │              │
│ (認証)          │     │ (非同期処理)     │              │
└─────────────────┘     └──────────────────┘              │
        │                        │                         │
        │                        ▼                         │
        │               ┌──────────────────┐              │
        │               │  Security AI     │◀─────────────┘
        │               │  (診断エンジン)  │
        │               └──────────────────┘
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌──────────────────┐
│     Stripe      │     │     GitHub       │
│   (決済)        │     │   (コード連携)   │
└─────────────────┘     └──────────────────┘
```

## ディレクトリ構造

### Frontend (`/web/`)
```
/web/
├── src/
│   ├── app/
│   │   ├── [lang]/                    # 多言語対応
│   │   │   ├── (auth)/                # 認証関連
│   │   │   │   ├── signin/            # サインイン
│   │   │   │   └── signup/            # サインアップ
│   │   │   ├── (main)/                # メインアプリ
│   │   │   │   ├── projects/          # プロジェクト一覧
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── [projectId]/   # プロジェクト詳細
│   │   │   │   │       ├── page.tsx      # ダッシュボード
│   │   │   │   │       ├── audit/        # 審査依頼
│   │   │   │   │       │   └── page.tsx
│   │   │   │   │       └── results/      # 審査結果
│   │   │   │   │           └── [auditId]/
│   │   │   │   │               └── page.tsx
│   │   │   │   ├── settings/         # 設定
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   └── plans/        # プラン管理
│   │   │   │   └── billing/          # 請求管理
│   │   │   └── page.tsx              # LP
│   │   └── auth/
│   │       └── callback/              # OAuth callback
│   ├── components/
│   │   ├── ui/                        # shadcn/ui
│   │   └── app/
│   │       ├── auth/                  # 認証コンポーネント
│   │       ├── project/               # プロジェクト関連
│   │       │   ├── project-card.tsx
│   │       │   ├── project-list.tsx
│   │       │   └── project-form.tsx
│   │       ├── audit/                 # 審査関連
│   │       │   ├── audit-form.tsx
│   │       │   ├── audit-table.tsx
│   │       │   ├── audit-status.tsx
│   │       │   └── audit-result.tsx
│   │       └── billing/               # 請求関連
│   ├── features/
│   │   ├── projects/                  # プロジェクト機能
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── types/
│   │   ├── audit/                     # 審査機能
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── types/
│   │   └── github/                    # GitHub連携
│   │       ├── hooks/
│   │       └── api/
│   └── lib/
│       ├── api/                       # API Client
│       │   └── generated/             # orvalで自動生成
│       └── supabase/                  # Supabase Client
└── middleware.ts                      # 認証・i18n
```

### Backend (`/api/`)
```
/api/
├── src/
│   ├── features/
│   │   ├── projects/                  # プロジェクト管理
│   │   │   ├── container.ts
│   │   │   ├── repositories/
│   │   │   │   └── project.repository.ts
│   │   │   └── use-cases/
│   │   │       ├── create-project/
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       ├── list-projects/
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       ├── get-project/
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       ├── update-project/
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       └── delete-project/
│   │   │           ├── dto.ts
│   │   │           ├── route.ts
│   │   │           └── use-case.ts
│   │   ├── audits/                   # 審査機能
│   │   │   ├── container.ts
│   │   │   ├── repositories/
│   │   │   │   ├── audit.repository.ts
│   │   │   │   └── audit-result.repository.ts
│   │   │   └── use-cases/
│   │   │       ├── create-audit/      # 審査依頼作成
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       ├── list-audits/       # 審査一覧
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       ├── get-audit/         # 審査詳細
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       ├── rerun-audit/       # 再審査
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       └── process-audit/     # 審査実行（非同期）
│   │   │           ├── dto.ts
│   │   │           ├── route.ts
│   │   │           └── use-case.ts
│   │   ├── security-ai/              # セキュリティAI
│   │   │   ├── container.ts
│   │   │   ├── repositories/
│   │   │   │   ├── url-scanner.repository.ts
│   │   │   │   ├── code-analyzer.repository.ts
│   │   │   │   └── vulnerability-detector.repository.ts
│   │   │   └── use-cases/
│   │   │       ├── scan-url/
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       └── analyze-code/
│   │   │           ├── dto.ts
│   │   │           ├── route.ts
│   │   │           └── use-case.ts
│   │   ├── github/                   # GitHub連携
│   │   │   ├── container.ts
│   │   │   ├── repositories/
│   │   │   │   └── github.repository.ts
│   │   │   └── use-cases/
│   │   │       ├── connect-github/
│   │   │       │   ├── dto.ts
│   │   │       │   ├── route.ts
│   │   │       │   └── use-case.ts
│   │   │       └── fetch-repository/
│   │   │           ├── dto.ts
│   │   │           ├── route.ts
│   │   │           └── use-case.ts
│   │   ├── billing/                  # 請求管理（既存流用）
│   │   ├── users/                    # ユーザー管理（既存流用）
│   │   └── stripe-webhook/           # Stripe Webhook（既存流用）
│   ├── drizzle/
│   │   └── db/
│   │       ├── schema.ts             # DBスキーマ
│   │       └── migrations/           # マイグレーション
│   ├── queue/                        # 非同期ジョブ
│   │   ├── handlers/
│   │   │   ├── audit-processor.ts    # 審査処理
│   │   │   └── notification.ts       # 通知
│   │   └── client.ts                 # Cloud Tasks Client
│   └── index.ts                      # エントリポイント
└── drizzle.config.ts
```

## データベース設計

### Drizzle ORM スキーマ定義 (`/api/src/drizzle/db/schema.ts`)

```typescript
import { relations, sql } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar, boolean, date, pgEnum } from 'drizzle-orm/pg-core'

// 定数定義
export const OAUTH_PROVIDERS = {
  GITHUB: 'github',
  GOOGLE: 'google',
  TWITTER: 'twitter',
} as const;

export const AUDIT_TYPES = {
  EXTERNAL: 'external',
  CODE: 'code',
} as const;

export const AUDIT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

export const SEVERITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

// Enum定義
export const oauthProviderEnum = pgEnum('oauth_provider', Object.values(OAUTH_PROVIDERS) as [string, ...string[]]);
export const auditTypeEnum = pgEnum('audit_type', Object.values(AUDIT_TYPES) as [string, ...string[]]);
export const auditStatusEnum = pgEnum('audit_status', Object.values(AUDIT_STATUS) as [string, ...string[]]);
export const severityLevelEnum = pgEnum('severity_level', Object.values(SEVERITY_LEVELS) as [string, ...string[]]);

// OAuth認証状態管理テーブル
export const oauthStates = pgTable(
  'oauth_states',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    
    // ユーザー関連
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId),
    
    // OAuth情報
    provider: oauthProviderEnum('provider').notNull(),
    providerUserId: varchar('provider_user_id', { length: 255 }),
    providerUsername: varchar('provider_username', { length: 255 }),
    accessToken: text('access_token'), // 暗号化して保存
    refreshToken: text('refresh_token'), // 暗号化して保存
    tokenExpiresAt: timestamp('token_expires_at'),
    
    // 連携状態
    isConnected: boolean('is_connected').default(true),
    connectedAt: timestamp('connected_at').default(sql`now()`),
    disconnectedAt: timestamp('disconnected_at'),
    
    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      userProviderIdx: index('oauth_states_user_provider_idx').on(table.userId, table.provider).unique(),
      providerIdx: index('oauth_states_provider_idx').on(table.provider),
    }
  }
)

// プロジェクトテーブル
export const projects = pgTable(
  'projects',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    
    // ユーザー関連
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId),
    
    // プロジェクト情報
    name: varchar('name', { length: 255 }).notNull(),
    url: varchar('url', { length: 500 }),
    githubRepoUrl: varchar('github_repo_url', { length: 500 }),
    description: text('description'),
    
    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      userIdIdx: index('projects_user_id_idx').on(table.userId),
    }
  }
)

// 審査テーブル
export const audits = pgTable(
  'audits',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    
    // プロジェクト関連
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    
    // 審査情報
    auditType: auditTypeEnum('audit_type').notNull(),
    targetUrl: varchar('target_url', { length: 500 }),
    status: auditStatusEnum('status').notNull().default(AUDIT_STATUS.PENDING),
    
    // 結果サマリー
    severitySummary: jsonb('severity_summary').$type<{
      critical: number
      high: number
      medium: number
      low: number
    }>(),
    
    // タイムスタンプ
    requestedAt: timestamp('requested_at').default(sql`now()`).notNull(),
    startedAt: timestamp('started_at'),
    completedAt: timestamp('completed_at'),
    
    // エラー情報
    errorMessage: text('error_message'),
  },
  (table) => {
    return {
      projectIdIdx: index('audits_project_id_idx').on(table.projectId),
      statusIdx: index('audits_status_idx').on(table.status),
    }
  }
)

// 審査結果詳細テーブル
export const auditResults = pgTable(
  'audit_results',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    
    // 審査関連
    auditId: uuid('audit_id')
      .notNull()
      .references(() => audits.id, { onDelete: 'cascade' }),
    
    // 脆弱性情報
    vulnerabilityType: varchar('vulnerability_type', { length: 100 }).notNull(),
    severity: severityLevelEnum('severity').notNull(),
    title: varchar('title', { length: 500 }).notNull(),
    description: text('description').notNull(),
    
    // 詳細情報
    affectedComponent: varchar('affected_component', { length: 500 }),
    recommendation: text('recommendation'),
    referenceLinks: text('reference_links').array(),
    
    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      auditIdIdx: index('audit_results_audit_id_idx').on(table.auditId),
      severityIdx: index('audit_results_severity_idx').on(table.severity),
    }
  }
)

// 審査クォータテーブル
export const auditQuotas = pgTable(
  'audit_quotas',
  {
    id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
    
    // ユーザー関連
    userId: uuid('user_id')
      .notNull()
      .references(() => profiles.userId),
    
    // クォータ情報
    month: date('month').notNull(), // YYYY-MM-01形式で保存
    usedCount: integer('used_count').notNull().default(0),
    limitCount: integer('limit_count').notNull(),
    
    // タイムスタンプ
    createdAt: timestamp('created_at').default(sql`now()`).notNull(),
    updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
  },
  (table) => {
    return {
      userMonthIdx: index('audit_quotas_user_month_idx').on(table.userId, table.month),
      userMonthUnique: index('audit_quotas_user_month_unique').on(table.userId, table.month).unique(),
    }
  }
)

// リレーション定義
export const oauthStatesRelations = relations(oauthStates, ({ one }) => ({
  user: one(profiles, {
    fields: [oauthStates.userId],
    references: [profiles.userId],
  }),
}))

export const projectsRelations = relations(projects, ({ one, many }) => ({
  user: one(profiles, {
    fields: [projects.userId],
    references: [profiles.userId],
  }),
  audits: many(audits),
}))

export const auditsRelations = relations(audits, ({ one, many }) => ({
  project: one(projects, {
    fields: [audits.projectId],
    references: [projects.id],
  }),
  results: many(auditResults),
}))

export const auditResultsRelations = relations(auditResults, ({ one }) => ({
  audit: one(audits, {
    fields: [auditResults.auditId],
    references: [audits.id],
  }),
}))

export const auditQuotasRelations = relations(auditQuotas, ({ one }) => ({
  user: one(profiles, {
    fields: [auditQuotas.userId],
    references: [profiles.userId],
  }),
}))

// 型定義のエクスポート
export type OAuthState = typeof oauthStates.$inferSelect
export type NewOAuthState = typeof oauthStates.$inferInsert
export type Project = typeof projects.$inferSelect
export type NewProject = typeof projects.$inferInsert
export type Audit = typeof audits.$inferSelect
export type NewAudit = typeof audits.$inferInsert
export type AuditResult = typeof auditResults.$inferSelect
export type NewAuditResult = typeof auditResults.$inferInsert
export type AuditQuota = typeof auditQuotas.$inferSelect
export type NewAuditQuota = typeof auditQuotas.$inferInsert
```

## API設計

### エンドポイント一覧

#### プロジェクト管理
- `GET /api/v1/projects` - プロジェクト一覧取得
- `POST /api/v1/projects` - プロジェクト作成
- `GET /api/v1/projects/:projectId` - プロジェクト詳細取得
- `PUT /api/v1/projects/:projectId` - プロジェクト更新
- `DELETE /api/v1/projects/:projectId` - プロジェクト削除

#### 審査管理
- `GET /api/v1/projects/:projectId/audits` - 審査一覧取得
- `POST /api/v1/projects/:projectId/audits` - 審査依頼作成
- `GET /api/v1/audits/:auditId` - 審査詳細取得
- `POST /api/v1/audits/:auditId/rerun` - 再審査依頼
- `GET /api/v1/audits/:auditId/results` - 審査結果取得

#### GitHub連携
- `POST /api/v1/github/connect` - GitHub連携開始
- `POST /api/v1/github/callback` - GitHub OAuth callback
- `DELETE /api/v1/github/disconnect` - GitHub連携解除
- `GET /api/v1/github/repositories` - リポジトリ一覧取得

#### 審査クォータ
- `GET /api/v1/quotas/current` - 現在の使用状況取得

### リクエスト/レスポンス例

#### POST /api/v1/projects/:projectId/audits
```typescript
// Request
{
  "auditType": "external" | "code",
  "targetUrl": "https://example.com", // external時のみ
  "githubRepoUrl": "https://github.com/user/repo" // code時のみ
}

// Response
{
  "auditId": "uuid",
  "projectId": "uuid",
  "auditType": "external",
  "targetUrl": "https://example.com",
  "status": "pending",
  "requestedAt": "2025-07-31T12:00:00Z"
}
```

## セキュリティ診断エンジン

### 外部テスト機能
1. **基本的な脆弱性スキャン**
   - XSS (Cross-Site Scripting)
   - SQLインジェクション
   - CSRF (Cross-Site Request Forgery)
   - セキュリティヘッダーチェック
   - SSL/TLS設定チェック

2. **APIセキュリティチェック**
   - 認証・認可の確認
   - レート制限の確認
   - エラーハンドリング

### コードチェック機能
1. **静的コード解析**
   - ハードコードされた認証情報
   - 脆弱な暗号化アルゴリズム
   - 安全でない乱数生成
   - パスワード強度チェック

2. **依存関係チェック**
   - 既知の脆弱性を持つライブラリ
   - 古いバージョンの警告

## 非同期処理フロー

```
1. ユーザーが審査依頼を作成
   ↓
2. APIがCloud Tasksにジョブを登録
   ↓
3. Cloud Tasksが審査処理エンドポイントを呼び出し
   ↓
4. セキュリティAIエンジンが診断実行
   ↓
5. 結果をDBに保存
   ↓
6. メールで結果通知
```

## 料金プラン実装

### プラン定義（/api/src/constants/plans.ts を拡張）
```typescript
export const PLAN_FEATURES = {
  free: {
    auditQuota: 3, // 月3回まで
    externalTest: true,
    codeCheck: false,
    reaudit: false,
    support: 'community'
  },
  indie: {
    auditQuota: 30, // 月30回まで
    externalTest: true,
    codeCheck: true,
    reaudit: true,
    support: 'email'
  },
  pro: {
    auditQuota: -1, // 無制限
    externalTest: true,
    codeCheck: true,
    reaudit: true,
    support: 'priority'
  }
};
```

## 開発フェーズ

### Phase 1: 基本機能実装（MVP）
- [ ] プロジェクト管理CRUD
- [ ] 外部テスト審査（基本的なチェックのみ）
- [ ] 審査結果表示
- [ ] メール通知

### Phase 2: 有料機能実装
- [ ] Stripe決済統合
- [ ] プラン別制限実装
- [ ] GitHub連携
- [ ] コードチェック機能

### Phase 3: 高度な機能
- [ ] 詳細な脆弱性診断
- [ ] カスタムルール設定
- [ ] チーム機能
- [ ] API提供

## セキュリティ考慮事項

1. **GitHub Access Token**
   - Supabase VaultまたはKMSで暗号化して保存
   - 定期的なトークンローテーション

2. **審査対象の制限**
   - 自分のプロジェクトのみ審査可能
   - レート制限の実装

3. **診断結果の保護**
   - RLSによるアクセス制御
   - 結果の暗号化保存

## モニタリング・ログ

1. **審査処理のモニタリング**
   - 処理時間
   - エラー率
   - 成功率

2. **使用状況の追跡**
   - ユーザー別の審査回数
   - 人気の診断項目
   - エラーパターン

## 将来的な拡張

1. **AI機能の強化**
   - 機械学習による誤検知の削減
   - コンテキストを考慮した診断
   - 修正提案の自動生成

2. **統合機能**
   - CI/CDパイプライン統合
   - Slack/Discord通知
   - JIRA/GitHub Issues連携

3. **エンタープライズ機能**
   - SAML/SSO対応
   - 監査ログ
   - コンプライアンスレポート


