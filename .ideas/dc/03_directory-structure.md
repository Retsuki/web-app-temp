# ディレクトリ設計（dc: Create Your Dashboard in 5 MINUTES）

前提
- アプリ（フロント+アプリAPI）と SDK/受信API の2リポジトリで構築します。

## リポジトリ構成（2レポ）
- app: フロント（Next.js）とアプリAPI（Hono）を同居させるモノレポ。DB/インフラ管理もこのレポで実施。
- sdk-ingest: SDK（TypeScript）と受信API（Hono）を同居させるモノレポ。公開エンドポイントとクライアント実装を一体管理。

備考
- app/api と ingest-api は同一DB（`schema.md` の `dc_*` テーブル）を参照。スキーマ管理は app 側で集中（Drizzle migrations）し、sdk-ingest は参照に留めるのがシンプル。

## app（フロント+アプリAPI）ディレクトリツリー（例）

```
.
├─ web/                               # Next.js (App Router)
│  ├─ package.json
│  ├─ next.config.ts
│  ├─ tsconfig.json
│  ├─ .env.example
│  ├─ public/
│  └─ src/
│     ├─ app/
│     │  ├─ layout.tsx
│     │  ├─ globals.css
│     │  └─ [lang]/
│     │     ├─ (public)/               # LP/Legal/Privacyなど
│     │     │  ├─ terms/page.tsx
│     │     │  └─ privacy-policy/page.tsx
│     │     ├─ (auth)/                 # signin/signup
│     │     │  ├─ signin/page.tsx
│     │     │  └─ signup/page.tsx
│     │     └─ (main)/                 # アプリ領域
│     │        ├─ layout.tsx
│     │        ├─ main-nav.tsx
│     │        ├─ dashboard/
│     │        │  └─ page.tsx
│     │        ├─ pricing/
│     │        │  └─ page.tsx
│     │        ├─ billing/
│     │        │  ├─ page.tsx
│     │        │  ├─ success/page.tsx
│     │        │  └─ cancel/page.tsx
│     │        └─ projects/
│     │           ├─ page.tsx                     # 一覧（検索/新規作成）
│     │           ├─ _components/
│     │           ├─ _containers/
│     │           ├─ new/
│     │           │  └─ page.tsx                 # 作成ウィザード（任意）
│     │           └─ [projectId]/
│     │              ├─ page.tsx                  # 概要（基本情報/進捗）
│     │              ├─ dashboard/
│     │              │  └─ page.tsx              # ダッシュボード（ウィジェット配置）
│     │              ├─ events/
│     │              │  └─ page.tsx              # イベント
│     │              ├─ cohorts/
│     │              │  └─ page.tsx              # コホート定義
│     │              ├─ settings/
│     │              │  └─ page.tsx              # Allowed domains / ingest keys
│     │              ├─ docs/
│     │              │  └─ page.tsx              # SDK 導入手順（公開鍵埋め込み）
│     │              └─ generate/
│     │                 └─ page.tsx              # LP URL/概要→AI 提案
│     ├─ components/                   # 再利用UI
│     ├─ features/                     # 機能単位UI
│     ├─ lib/
│     │  ├─ api/
│     │  │  ├─ generated/              # Orval 出力
│     │  │  ├─ orval-client.ts
│     │  │  └─ orval-server-client.ts
│     │  ├─ supabase/
│     │  └─ utils.ts
│     └─ middleware.ts
│  ├─ orval.config.ts                  # OpenAPI → クライアント生成
│  └─ openapi.json                     # app/api から生成物 or 取得
├─ api/                               # Hono (アプリAPI)
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ .env.example
│  ├─ drizzle.config.ts
│  └─ src/
│     ├─ index.ts                      # エントリ (serve)
│     ├─ constants/
│     ├─ _shared/
│     │  ├─ factory/
│     │  ├─ middleware/                # cors/security-headers/rate-limit など
│     │  ├─ utils/
│     │  │  ├─ error/
│     │  │  └─ logger.ts
│     │  └─ types/
│     ├─ features/
│     │  ├─ projects/
│     │  │  ├─ container.ts
│     │  │  ├─ repositories/
│     │  │  └─ use-cases/              # <case>/{route,use-case,dto}.ts
│     │  ├─ users/
│     │  ├─ billing/
│     │  ├─ definitions/
│     │  │  ├─ event-definitions/
│     │  │  └─ cohort-definitions/
│     │  ├─ analytics/                 # 分析系（集計/クエリ）
│     │  │  ├─ use-cases/
│     │  │  │  ├─ funnel/
│     │  │  │  ├─ flow/
│     │  │  │  └─ retention/
│     │  │  └─ jobs/
│     │  │     └─ aggregate-events-daily/   # dc_agg_events_daily 更新バッチ（MVP）。event_key集計 + event_definition_id冗長保持
│     │  └─ dashboards/
│     └─ drizzle/
│        ├─ db/
│        │  ├─ schema.ts               # dc_* テーブル
│        │  ├─ types.ts
│        │  └─ seed/
│        ├─ views/                      # 分析用ビュー/マテビュー（任意）
│        ├─ migrations/                 # dc_* + dc_agg_events_daily（MVPで含む）
│        └─ staging/                    # 集計一時テーブル（必要時）
├─ supabase/                          # ローカル/検証用設定
│  ├─ config.toml
│  └─ seed.sql
├─ pulumi/                            # IaC (GCP)
│  ├─ Pulumi.yaml
│  ├─ package.json
│  ├─ tsconfig.json
│  └─ src/
│     ├─ config/
│     └─ resources/                   # cloud-run/api-gateway/secrets等
├─ scripts/
│  ├─ setup.sh
│  ├─ env-switch.sh
│  ├─ api/
│  │  ├─ env-download.sh
│  │  ├─ env-update.sh
│  │  └─ generate-openapi.sh          # OpenAPI 出力→web/openapi.json
│  └─ web/
│     ├─ env-download.sh
│     ├─ env-update.sh
│     └─ build-deploy.sh
├─ .docs/
│  └─ README.md
├─ .vscode/
│  └─ settings.json
├─ .env.example
├─ package.json                       # workspaces: ["web","api","pulumi"]
├─ pnpm-workspace.yaml                # または npm/yarn workspaces
├─ biome.json                         # または eslint/prettier 設定
└─ README.md
```
