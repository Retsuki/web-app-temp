# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Goal

このプロジェクトは、新規アプリ開発を爆速化するためのテンプレートアプリケーションです。

### 存在意義
新規アプリ開発時に必要となる基本機能を事前に実装しておくことで、開発者がメイン機能の開発に集中できる環境を提供します。

### 実装済みの基本機能
- ✅ 認証システム（メールアドレス認証・Google OAuth認証）
- ✅ ユーザープロフィール管理
- ✅ Supabase連携（認証・データベース）
- ✅ APIサーバー基盤（Hono）
- ✅ 共通UIコンポーネント（shadcn/ui）
- ✅ 多言語対応（next-intl: 日本語・英語）
- ✅ 型安全なAPI連携（OpenAPI + openapi-fetch）
- 🚧 決済機能（準備中）
- 🚧 通知システム（準備中）

## Project Overview

モノレポ構成で以下のアプリケーションを含みます：
- `/web/` - Next.js 15.3.4 フロントエンドアプリケーション
- `/api/` - Hono ベースのAPIバックエンド

### Tech Stack

#### Frontend (`/web/`)
- **Framework**: Next.js 15.3.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Form**: React Hook Form + Zod
- **Auth**: Supabase Auth (Email + Google OAuth)
- **i18n**: next-intl (日本語・英語対応)
- **API Client**: openapi-fetch + TanStack Query
- **Dev Server**: Turbopack
- **Code Quality**: ESLint + Biome

#### Backend (`/api/`)
- **Framework**: Hono
- **Runtime**: Node.js
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **Validation**: Zod
- **Logging**: Pino
- **Code Quality**: Biome

#### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Storage**: Supabase Storage（予定）
- **Deployment**: Vercel（予定）

## Development Commands

### 全体
```bash
# ルートディレクトリで
npm run dev         # Supabase + API + Web を一括起動
npm run lint        # Biomeでリント
npm run format      # Biomeでフォーマット
npm run check       # Biomeでチェック
npm run check:apply # Biomeでチェックと修正

# APIスキーマ生成
npm run gen:api     # OpenAPIスキーマからTypeScript型定義を生成
npm run api:schema  # OpenAPIドキュメント取得と型生成を一括実行
npm run fetch:openapi # OpenAPIドキュメントを取得のみ

# セットアップ・デプロイ
npm run setup       # 初期プロジェクトセットアップ
npm run setup:gcp   # Google Cloud Platform セットアップ
npm run deploy:gcp  # GCPへデプロイ
```

### Frontend
```bash
cd web
npm run dev         # 開発サーバー起動 (http://localhost:3000)
npm run build       # プロダクションビルド
npm run start       # プロダクションサーバー起動
npm run lint        # リントチェック
npm run gen:api     # OpenAPIスキーマからTypeScript型定義を生成
```

### Backend
```bash
cd api
npm run dev         # 開発サーバー起動 (http://localhost:8080)
npm run build       # TypeScriptビルド
npm run start       # プロダクションサーバー起動
npm run db:generate # Drizzleマイグレーション生成
npm run db:push     # データベースへマイグレーション適用
npm run db:seed     # シードデータ投入
```

### Supabase Local
```bash
supabase start      # ローカルSupabase起動
supabase stop       # ローカルSupabase停止
supabase status     # 状態確認
```

## Architecture

### Directory Structure
```
web_app_temp/
├── /web/                           # フロントエンドアプリケーション
│   ├── /src/
│   │   ├── /app/                   # Next.js App Router
│   │   │   ├── /(auth)/            # 認証関連ページ
│   │   │   │   ├── /signin/        # サインインページ
│   │   │   │   └── /signup/        # サインアップページ
│   │   │   ├── /(main)/            # メインアプリケーション
│   │   │   │   └── /dashboard/     # ダッシュボード
│   │   │   ├── /auth/              # 認証コールバック
│   │   │   │   └── /callback/      # OAuth認証コールバック
│   │   │   ├── /[locale]/          # 多言語対応ルート (ja/en)
│   │   │   └── page.tsx            # ホームページ
│   │   ├── /components/
│   │   │   ├── /ui/                # shadcn/uiコンポーネント
│   │   │   └── /app/               # カスタムコンポーネント
│   │   │       ├── /auth/          # 認証関連
│   │   │       ├── /button/        # ボタンコンポーネント
│   │   │       └── /input/         # フォーム入力コンポーネント
│   │   ├── /lib/
│   │   │   ├── /api/               # APIクライアント・型定義
│   │   │   ├── /auth/              # 認証関連ユーティリティ
│   │   │   └── /supabase/          # Supabaseクライアント
│   │   ├── /i18n/                  # 国際化設定
│   │   └── /messages/              # 翻訳ファイル (ja.json, en.json)
│   └── middleware.ts               # 認証・i18nミドルウェア
│
├── /api/                           # バックエンドAPIサーバー
│   ├── /src/
│   │   ├── /drizzle/               # データベース関連
│   │   │   ├── /db/
│   │   │   │   ├── schema.ts      # データベーススキーマ
│   │   │   │   ├── database.ts    # データベース接続
│   │   │   │   └── /seed/         # シードデータ
│   │   │   └── /migrations/       # マイグレーションファイル
│   │   ├── /features/              # 機能別モジュール
│   │   │   └── /{feature}/         # 各機能ディレクトリ
│   │   │       ├── container.ts    # DIコンテナ
│   │   │       ├── repositories/   # データアクセス層
│   │   │       └── use-cases/      # ビジネスロジック層
│   │   ├── /middleware/            # APIミドルウェア
│   │   ├── /route/                 # APIルート定義
│   │   ├── /utils/                 # ユーティリティ関数
│   │   └── index.ts               # APIサーバーエントリポイント
│   └── drizzle.config.ts          # Drizzle設定
│
├── /supabase/                      # Supabase設定
│   ├── config.toml                 # Supabase設定ファイル
│   └── seed.sql                    # 初期シードSQL
│
├── biome.json                      # Biome設定
├── package.json                    # ルートパッケージ
├── .env.example                    # 環境変数テンプレート
└── .gitignore                      # Git除外設定
```

### Key Features

#### 認証システム
- **メールアドレス認証**: サインアップ/サインイン
- **Google OAuth**: ワンクリックでGoogleアカウント連携
- **セッション管理**: Supabase Authによる安全なセッション管理
- **保護されたルート**: ミドルウェアによる認証チェック

#### データベース設計
- **profiles**: ユーザープロフィール情報
  - user_id (Supabase AuthのユーザーID)
  - email
  - nickname
  - created_at/updated_at
- **subscriptions**: Stripeサブスクリプション管理
  - subscription_id, user_id, stripe_subscription_id
  - price_id, status, current_period_end等
- **payment_history**: 決済履歴
  - payment_id, user_id, amount, currency
  - stripe_payment_intent_id, status等
- **webhook_events**: Webhookイベント記録
  - stripe_webhook_event_id, type, processed
- **plan_limits**: プラン別機能制限
  - plan_id, feature, limit_value

#### UIコンポーネント
- **FormInput**: React Hook Form対応の入力コンポーネント
- **PrimaryButton**: プライマリーアクションボタン
- **OutlineButton**: セカンダリーアクションボタン
- **GoogleButton**: Google認証専用ボタン

#### カラーシステム
- **Primary Color**: Mindaro系の緑黄色 (#90d80a)
- **Secondary Color**: 深緑色 (#44670d)
- **ダークモード対応**: 自動切り替え対応

#### 国際化 (i18n)
- **フレームワーク**: next-intl (App Router対応)
- **対応言語**: 日本語 (`ja`)、英語 (`en`)
- **デフォルト言語**: 日本語
- **URLルーティング**: ロケールプレフィックス常時表示 (`/ja/`, `/en/`)
- **翻訳ファイル**: `/web/src/messages/{locale}.json`
- **ナビゲーション**: カスタムヘルパー (`Link`, `redirect`, `usePathname`, `useRouter`)

### Environment Variables
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# API
API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:8080

# JWT
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Google Cloud (for deployment)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
```

### Import Aliases
- `@/*` - `/web/src/*` のエイリアス

### API Client Architecture

#### Type-safe API Integration
- **Schema Generation**: OpenAPIスキーマから自動生成される型定義
- **API Clients**:
  - `apiClient` - 認証不要のエンドポイント用
  - `createAuthenticatedClient()` - Supabase認証トークン自動付与
- **Type Generation Workflow**:
  1. `npm run api:schema` - OpenAPIスキーマ取得と型生成
  2. 型定義は `/web/src/lib/api/schema.d.ts` に生成
  3. APIクライアントが自動的に型を利用

### API Architecture

#### Feature-based Modular Architecture
- **Route Pattern**: `/api/v1/{feature}` (例: `/api/v1/users`)
- **機能構成**: `/api/src/features/{feature}/`
  - `container.ts` - DIコンテナ定義
  - `index.ts` - ルートエクスポート
  - `repositories/` - データアクセス層
  - `use-cases/{operation}/` - 各操作の実装
    - `dto.ts` - リクエスト/レスポンス型
    - `route.ts` - エンドポイント定義
    - `use-case.ts` - ビジネスロジック

#### Service Container Pattern
- DIコンテナによる依存性注入
- ミドルウェアで一元的に初期化
- テスタビリティの向上

#### OpenAPI Integration
- Hono Zod OpenAPIによる型安全なAPI定義
- 自動的なドキュメント生成
- フロントエンドとの型共有
- APIドキュメント: http://localhost:8080/api/v1/doc
- Swagger UI: http://localhost:8080/api/v1/ui

#### Authentication Flow
- **Frontend → API**: Supabase JWTトークンをAuthorizationヘッダーで送信
- **API Validation**: ミドルウェアでJWTトークンを検証
- **User Context**: 検証済みユーザー情報をコンテキストに格納

## Best Practices

### コーディング規約
- TypeScriptを使用し、型安全性を保つ
- React Hook FormとZodでフォームバリデーション
- Server ComponentsとClient Componentsを適切に使い分ける
- エラーハンドリングを適切に実装する
- APIはOpenAPI仕様に準拠

### セキュリティ
- 環境変数でシークレット情報を管理
- Row Level Security (RLS)でデータアクセスを制御
- Server Actionsで安全なサーバーサイド処理

### パフォーマンス
- Next.js App Routerの最適化機能を活用
- 画像最適化（next/image）
- コード分割とレイジーローディング

## Development Notes

### Quick Start
```bash
# 1. 環境変数設定
cp .env.example .env
# .envファイルを編集してSupabaseとGoogle OAuthの認証情報を設定

# 2. 依存関係インストール
npm install

# 3. 開発環境起動
npm run dev  # Supabase, API, Webを一括起動
```

### Port Usage
- 3000: Frontend (Next.js)
- 8080: API Server (Hono)
- 54321: Supabase Studio
- 54322: Supabase DB
- 54323: Supabase Auth

### Testing Workflow
1. **Lint & Format**: `npm run check:apply`
2. **Type Check**: フロントエンド/APIそれぞれで `npm run build`
3. **API Integration**: `npm run api:schema` で最新の型定義を取得

### Code Quality Rules
- **IMPORTANT**: コードの変更や追加を行った後は必ず `npm run lint` または `npm run check:apply` を実行してコード品質を保つこと
- Biomeによる自動フォーマットとリントチェックを活用する
- コミット前にも必ずlintを実行する

## Future Enhancements
- 決済システム（Stripe連携）
- メール通知システム
- ファイルアップロード機能
- PWA対応
- テスト環境（Jest, Playwright）
- CI/CD パイプライン
- モニタリング・分析