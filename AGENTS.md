# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## 目次

1. [Project Goal](#project-goal) - プロジェクトの目的
2. [Project Overview](#project-overview) - 技術スタック
3. [Development Commands](#development-commands) - 開発コマンド
4. [Architecture](#architecture) - アーキテクチャ詳細
5. [Infrastructure Architecture](#infrastructure-architecture) - インフラ構成
6. [Best Practices](#best-practices) - ベストプラクティス
7. [Deployment Guide](#deployment-guide) - デプロイ手順
8. [Development Notes](#development-notes) - 開発メモ
9. [Future Enhancements](#future-enhancements) - 今後の拡張予定

## Project Goal

このプロジェクトは、新規アプリ開発を爆速化するためのテンプレートアプリケーションです。

### プロジェクトの目的
新規アプリ開発時に必要となる基本機能を事前に実装しておくことで、開発者がメイン機能の開発に集中できる環境を提供します。

### ✅ 実装済みの基本機能
- ✅ 認証システム（メールアドレス認証・Google OAuth認証）
- ✅ ユーザープロフィール管理
- ✅ Supabase連携（認証・データベース・ストレージ）
- ✅ APIサーバー基盤（Hono）
- ✅ 共通UIコンポーネント（shadcn/ui）
- ✅ 型安全なAPI連携（OpenAPI + orval）
- ✅ 決済機能（Stripe連携）
- ✅ ファイルアップロード機能（画像リサイズ、進捗表示、プレビュー）
- ✅ 国際化対応（日本語・英語）
- ✅ ダークモード対応
- 🚧 Google Analytics連携
- 🚧 通知システム（準備中）

## Project Overview

### アプリケーション構成
モノレポ構成で以下のアプリケーションを含みます：
- **`/web/`** - Next.js 15.3.4 フロントエンドアプリケーション
- **`/api/`** - Hono ベースのAPIバックエンド
- **`/api-gateway-stripe-webhook/`** - Stripe Webhook受信用APIゲートウェイ

### Tech Stack（技術スタック）

#### Frontend (`/web/`)
- **Framework**: Next.js 15.3.4 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui
- **Form**: React Hook Form + Zod
- **Auth**: Supabase Auth (Email + Google OAuth)
- **API Client**: orval (OpenAPI Generator) + TanStack Query
- **Storage**: Supabase Storage
- **i18n**: 組み込み国際化システム（日本語・英語）
- **Toast**: Sonner
- **Dev Server**: Turbopack
- **Code Quality**: Biome

#### Backend (`/api/`)
- **Framework**: Hono
- **Runtime**: Node.js (ES Modules)
- **Database**: PostgreSQL (via Supabase)
- **ORM**: Drizzle ORM
- **API Documentation**: Hono Zod OpenAPI + Swagger UI
- **Validation**: Zod
- **Logging**: Pino
- **Payment**: Stripe SDK
- **Code Quality**: Biome

#### Infrastructure
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Payment**: Stripe (Checkout, Webhooks, Customer Portal)
- **Storage**: Supabase Storage
- **Deployment**: Google Cloud Platform
  - Frontend: Cloud Run (public, 認証不要)
  - Backend: Cloud Run (private, IAM認証必須)
  - Region: asia-northeast1
- **CI/CD**: GitHub Actions + Cloud Build
- **Secret Management**: Google Secret Manager
- **Monitoring**: Cloud Logging, Error Reporting

## Development Commands

以下のコマンドをプロジェクトルートで実行できます。

### 🚀 全体コマンド
```bash
# ルート（ワークスペース統括）
npm run dev                    # API + Web を同時起動（Web=3000, API=8080）
npm run lint                   # Biome lint（リポジトリ全体）
npm run format                 # Biome format --write（リポジトリ全体）
npm run typecheck              # web と api の型チェックを順次実行

# OpenAPI → クライアント生成（API 起動中が前提）
npm run gen:api                # web/openapi.json を更新し orval で生成

# DB（Drizzle, api へプロキシ）
npm run db:generate            # マイグレーション生成
npm run db:push                # スキーマ適用
npm run db:migrate             # 既存マイグレーション実行
npm run db:seed                # シード投入
npm run db:check               # Drizzle 定義の検証

# Supabase（ローカル）
npm run supabase:start         # 起動
npm run supabase:stop          # 停止（プロジェクトID固定）
npm run supabase:db:reset      # DB リセット

# Pulumi（IaC）
npm run pulumi:preview:dev     # dev のプレビュー
npm run pulumi:preview:prod    # prod のプレビュー
npm run pulumi:dev             # dev に適用（up）
npm run pulumi:prod            # prod に適用（up）
```

### 💻 Frontend
```bash
cd web
npm run dev         # 開発サーバー起動 (http://localhost:3000)
npm run build       # プロダクションビルド
npm run start       # プロダクションサーバー起動
npm run lint        # Biomeリントチェック
npm run lint:fix    # Biome自動修正
npm run format      # Biomeフォーマット
npm run check       # Biomeチェック（非破壊）
npm run check:apply # Biomeチェック + 自動修正
npm run orval       # OpenAPIからクライアント生成
npm run gen:api     # orval のエイリアス
npm run typecheck   # 型チェック
```

### ⚙️ Backend
```bash
cd api
npm run dev         # 開発サーバー起動 (http://localhost:8080)
npm run build       # TypeScriptビルド
npm run start       # プロダクションサーバー起動
npm run lint        # Biomeリント
npm run format      # Biomeフォーマット
npm run typecheck   # 型チェック
npm run db:generate # Drizzleマイグレーション生成
npm run db:push     # データベースへマイグレーション適用
npm run db:migrate  # 既存マイグレーション実行
npm run db:check    # Drizzle 定義の検証
npm run db:seed     # シードデータ投入
```

### 🗄️ Supabase Local
```bash
npm run supabase:start      # ローカル Supabase 起動
npm run supabase:stop       # ローカル Supabase 停止
npm run supabase:db:reset   # DB リセット
```

## Architecture

### Directory Structure
```
web_app_temp/
├── /api-gateway-stripe-webhook/    # Stripe Webhook受信用APIゲートウェイ
│   ├── docs.md                     # セットアップガイド
│   └── openapi2-run.yaml           # OpenAPI定義（ルーティング設定）
│
├── /web/                           # フロントエンドアプリケーション
│   ├── /src/
│   │   ├── /app/                   # Next.js App Router
│   │   │   ├── /(ui)/              # UIコンポーネントショーケース
│   │   │   ├── /[lang]/            # 多言語対応ルート (ja/en)
│   │   │   │   ├── /(auth)/        # 認証関連ページグループ
│   │   │   │   │   ├── /signin/    # サインインページ
│   │   │   │   │   ├── /signup/    # サインアップページ
│   │   │   │   │   └── /auth/      # 認証処理
│   │   │   │   │       └── /callback/ # OAuth認証コールバック
│   │   │   │   ├── /(main)/        # メインアプリケーション（認証必須）
│   │   │   │   │   ├── /dashboard/ # ダッシュボード
│   │   │   │   │   ├── /pricing/   # 料金プランページ
│   │   │   │   │   └── /billing/   # 請求管理ページ
│   │   │   │   ├── /(public)/      # 公開ページ
│   │   │   │   │   ├── /legal/     # 法的文書
│   │   │   │   │   ├── /privacy-policy/ # プライバシーポリシー
│   │   │   │   │   └── /terms/     # 利用規約
│   │   │   │   └── page.tsx        # ホームページ
│   │   │   └── /dictionaries/      # 翻訳ファイル
│   │   │       ├── ja.json         # 日本語翻訳
│   │   │       └── en.json         # 英語翻訳
│   │   ├── /components/
│   │   │   ├── /ui/                # shadcn/uiコンポーネント
│   │   │   └── /app/               # カスタムコンポーネント
│   │   │       ├── /button/        # ボタンコンポーネント
│   │   │       ├── /checkbox/      # チェックボックス
│   │   │       ├── /input/         # フォーム入力
│   │   │       ├── /radio/         # ラジオボタン
│   │   │       ├── /profile/       # プロフィール関連
│   │   │       └── /provider/      # プロバイダー
│   │   ├── /features/              # 機能別モジュール（Bulletproof React）
│   │   │   ├── /auth/              # 認証機能
│   │   │   ├── /file-upload/       # ファイルアップロード機能
│   │   │   ├── /i18n/              # 国際化機能
│   │   │   └── /toast/             # トースト通知
│   │   ├── /lib/
│   │   │   ├── /api/               # APIクライアント
│   │   │   │   ├── /generated/     # 自動生成された型とクライアント
│   │   │   │   ├── orval-client.ts # クライアントサイドAPI
│   │   │   │   ├── orval-server-client.ts # サーバーサイドAPI
│   │   │   │   └── server-api.ts   # サーバーAPIユーティリティ
│   │   │   └── /supabase/          # Supabaseクライアント
│   │   └── middleware.ts           # 認証・i18nミドルウェア
│   └── cloudbuild.yaml             # Cloud Buildデプロイ設定
│
├── /api/                           # バックエンドAPIサーバー
│   ├── cloudbuild.yaml             # Cloud Buildデプロイ設定
│   ├── /src/
│   │   ├── /_shared/               # 共通モジュール
│   │   │   ├── /middleware/        # ミドルウェア
│   │   │   │   ├── /auth/          # 認証ミドルウェア（複数プロバイダ対応）
│   │   │   │   ├── /cors/          # CORS設定
│   │   │   │   └── /service-container/ # DIコンテナ
│   │   │   ├── /utils/             # ユーティリティ
│   │   │   │   ├── /auth/          # 認証ユーティリティ
│   │   │   │   ├── /error/         # エラーハンドリング
│   │   │   │   └── /storage/       # ストレージユーティリティ
│   │   │   └── /types/             # 共通型定義
│   │   ├── /drizzle/               # データベース関連
│   │   │   ├── /db/
│   │   │   │   ├── schema.ts      # データベーススキーマ
│   │   │   │   ├── database.ts    # データベース接続
│   │   │   │   └── /seed/         # シードデータ
│   │   │   └── /migrations/       # マイグレーションファイル
│   │   ├── /features/              # 機能別モジュール
│   │   │   ├── /auth/              # 認証（初期セットアップ等）
│   │   │   ├── /billing/           # 請求・サブスクリプション管理
│   │   │   ├── /stripe-webhook/    # Stripe Webhookハンドラー
│   │   │   ├── /users/             # ユーザー管理
│   │   │   ├── /projects/          # プロジェクト管理
│   │   │   └── /health/            # ヘルスチェック
│   │   ├── /lib/                   # 外部ライブラリ設定
│   │   │   └── stripe.ts          # Stripeクライアント設定
│   │   ├── /constants/             # 定数定義
│   │   │   └── plans.ts           # 料金プラン定義
│   │   └── index.ts               # APIサーバーエントリポイント
│   └── drizzle.config.ts          # Drizzle設定
│
├── /supabase/                      # Supabase（ローカル）設定
│   └── config.toml                 # Supabase CLI 設定
│
├── /pulumi/                        # インフラ（IaC）
│   └── ...                         # dev/prod スタック等
│
├── /.docs/                         # ドキュメント
├── /.vscode/                       # エディタ設定
├── /.ideas/                        # アイデア・メモ
├── biome.json                      # Biome設定
├── package.json                    # ルートパッケージ
└── .gitignore                      # Git除外設定
```

### 🔑 Key Features（主要機能）

#### 🔐 認証システム
- **メールアドレス認証**: サインアップ/サインイン
- **Google OAuth**: ワンクリックでGoogleアカウント連携
- **セッション管理**: Supabase Authによる安全なセッション管理
- **保護されたルート**: ミドルウェアによる認証チェック

#### 🗄️ データベース設計
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

#### 🎨 UIコンポーネント
- **FormInput**: React Hook Form対応の入力コンポーネント
- **PrimaryButton**: プライマリーアクションボタン
- **OutlineButton**: セカンダリーアクションボタン
- **GoogleButton**: Google認証専用ボタン

#### 💳 決済システム（Stripe）
- **サブスクリプション管理**: Free/Indie/Proの3プラン構成
- **料金プラン**: 月額・年額の選択が可能
- **チェックアウトフロー**: Stripe Checkoutによる安全な決済
- **Webhookハンドリング**: 決済イベントの自動処理
- **プラン管理機能**:
  - 現在のサブスクリプション状態表示
  - プラン変更・アップグレード
  - サブスクリプションキャンセル
  - 支払い履歴の確認
- **カスタマーポータル**: Stripeカスタマーポータルへのアクセス

#### 📁 ファイルアップロードシステム
- **Supabase Storage統合**: セキュアなファイル管理
- **画像処理**: 自動リサイズ、フォーマット変換
- **進捗表示**: リアルタイムアップロード進捗
- **プレビュー機能**: 画像・ドキュメントのプレビュー
- **ドラッグ&ドロップ**: 直感的なファイル選択
- **バリデーション**: ファイルサイズ・タイプの検証

#### 🎨 カラーシステム
- **Primary Color**: Mindaro系の緑黄色 (#90d80a)
- **Secondary Color**: 深緑色 (#44670d)
- **ダークモード対応**: 自動切り替え対応

### Environment Variables
```bash
# 配置場所
# - web/.env.local         # フロント（NEXT_PUBLIC_* など）
# - api/.env               # API（サーバー機密）
# - /etc/secrets/.env      # 本番で自動読込（api）
# 開発環境用ポート設定（オプション）
# DEV_WEB_PORT=3001  # デフォルト: 3000
# DEV_API_PORT=8081  # デフォルト: 8080

# Supabase
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# API URLs（ポート変更時は要更新）
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# JWT
SUPABASE_JWT_SECRET=your_supabase_jwt_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_INDIE_MONTHLY=price_...
STRIPE_PRICE_ID_INDIE_YEARLY=price_...
STRIPE_PRICE_ID_PRO_MONTHLY=price_...
STRIPE_PRICE_ID_PRO_YEARLY=price_...

# Google Cloud (for deployment)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_REGION=asia-northeast1

# Cloud Run URLs (Production)
API_URL=https://api-PROJECT_ID.run.app
SITE_URL=https://web-PROJECT_ID.run.app
```

### Import Aliases
- `@/*` - `/web/src/*` のエイリアス
- `@/i18n` - `/web/i18n` のエイリアス

### Authentication Providers
APIは複数の認証プロバイダーに対応：
- **Supabase Auth** (デフォルト)
- **Firebase Auth** (オプション)
- **Cloud Run** (GCP環境用)

### API Client Architecture

#### Type-safe API Integration (Orval)
- **Code Generation**: Orvalを使用したOpenAPIからの自動生成
- **Generated Content**:
  - 型定義 (`/web/src/lib/api/generated/schemas/`)
  - APIクライアント (`/web/src/lib/api/generated/{feature}/`)
  - MSWモック (`*.msw.ts`)
- **API Clients**:
  - `apiClient` - パブリックエンドポイント用
  - `createClient()` - 認証付きクライアントサイドAPI
  - `createServerClient()` - 認証付きサーバーサイドAPI
- **Type Generation Workflow**:
  1. `npm run gen:api` - OpenAPIスキーマ取得とコード生成
  2. 3つのクライアントが自動生成（client, server, public）
  3. TanStack Queryフックも自動生成

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

## Infrastructure Architecture

### CI/CD Pipeline (Cloud Build)

#### 📦 Web Application (`/web/cloudbuild.yaml`)
Webアプリケーションの自動デプロイパイプライン：

1. **Secret Manager統合** - 環境変数を安全に取得
2. **Docker イメージビルド** - Next.jsアプリをコンテナ化
3. **Container Registry プッシュ** - GCRへイメージ保存
4. **Cloud Run デプロイ** - 本番環境へ自動デプロイ

**設定詳細:**
- サービス名: `web-app-web`
- リージョン: `asia-northeast1`
- メモリ: 512Mi / CPU: 1
- 認証: 公開アクセス許可（`--allow-unauthenticated`）
- サービスアカウント: `web-sa@PROJECT_ID.iam.gserviceaccount.com`
- 環境変数: Secret Manager経由で注入

#### ⚙️ API Server (`/api/cloudbuild.yaml`)
APIサーバーの自動デプロイパイプライン：

1. **Docker イメージビルド** - Honoアプリをコンテナ化
2. **Container Registry プッシュ** - GCRへイメージ保存
3. **Cloud Run デプロイ** - セキュアな本番環境へデプロイ

**設定詳細:**
- サービス名: `web-app-api`
- リージョン: `asia-northeast1`
- メモリ: 512Mi / CPU: 1
- 認証: IAM認証必須（`--no-allow-unauthenticated`）
- サービスアカウント: `api-sa@PROJECT_ID.iam.gserviceaccount.com`
- シークレット: `api-env-production`として一括マウント

### デプロイアーキテクチャ
```
┌───────────────┐        ┌──────────────────────────┐
│  Cloud Run      │  IAM   │  Cloud Run (API / Hono)  │
│  (Next.js 15)   │◀───────│  --no-allow-unauth       │
│  public URL     │ ID tok │  api-<env>-<project>     │
└───────┬─────────┘        └──────────┬───────────────┘
        │                              │
        │                              ▲ IAM認証
        │                              │
        │                    ┌─────────┴──────────┐
        │                    │   API Gateway      │
        │                    │ Stripe Webhook用   │◀── Webhook
        │                    └────────────────────┘     (Stripe)
        │
        ▼
┌───────────────────┐           ┌────────────────┐
│  Supabase (Auth)  │           │    Stripe      │
│  PostgreSQL DB    │           └────────────────┘
└───────────────────┘
```

### セキュリティアーキテクチャ
- **Cloud Run IAM**: API は IAM 認証必須（`--no-allow-unauthenticated`）
- **API Gateway**: Stripe Webhook受信用のセキュアな公開エンドポイント
  - 外部からのWebhookを受信し、認証付きでCloud Runへ転送
  - Stripeからの直接アクセスを可能にしつつセキュリティを維持
- **サービスアカウント**: 最小権限の原則で分離
  - `web-sa`: WebフロントエンドからAPIへの呼び出し権限のみ
  - `api-sa`: Secret Manager読み取り権限
  - `web-app-stripe-gw-sa`: API Gateway用、Cloud Run呼び出し権限のみ
- **Secret Manager**: 機密情報の暗号化保存
- **ID Token**: Web → API 間の認証にGoogle IDトークンを使用

### サービスアカウント構成
```bash
# API用サービスアカウント
api-sa@PROJECT_ID.iam.gserviceaccount.com
└── roles/secretmanager.secretAccessor

# Web用サービスアカウント  
web-sa@PROJECT_ID.iam.gserviceaccount.com
└── roles/run.invoker (APIサービスに対して)

# Stripe Webhook Gateway用サービスアカウント
web-app-stripe-gw-sa@PROJECT_ID.iam.gserviceaccount.com
└── roles/run.invoker (APIサービスに対して)

# Cloud Build用権限
PROJECT_NUMBER-compute@developer.gserviceaccount.com
├── roles/run.admin
└── roles/iam.serviceAccountUser
```

### コスト最適化
- **月額コスト目安**:
  - Cloud Run: 無料枠内（~2M req, 360k GiB-s）
  - Supabase: Free Plan (500MB DB)
  - **合計**: $0〜25/月（トラフィック次第）

### モニタリング戦略
- **Cloud Logging**: 構造化ログ出力
- **Error Reporting**: 5xx エラー自動集計
- **Alert Policies**: エラー率 > 5% でメール通知
- **Supabase Logs**: Auth失敗の監視

## Best Practices

### 📝 コーディング規約
- TypeScriptを使用し、型安全性を保つ
- React Hook FormとZodでフォームバリデーション
- Server ComponentsとClient Componentsを適切に使い分ける
- エラーハンドリングを適切に実装する
- APIはOpenAPI仕様に準拠

### 🔒 セキュリティ
- 環境変数でシークレット情報を管理
- Row Level Security (RLS)でデータアクセスを制御
- Server Actionsで安全なサーバーサイド処理

### ⚡ パフォーマンス
- Next.js App Routerの最適化機能を活用
- 画像最適化（next/image）
- コード分割とレイジーローディング

## Deployment Guide

### 🚀 自動デプロイ（推奨）

Cloud Buildを使用した自動デプロイ：

```bash
# GitHub リポジトリと Cloud Build の連携設定
gcloud builds triggers create github \
  --repo-name=web-app-temp \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=web/cloudbuild.yaml \
  --name=web-app-web-trigger

# API用のトリガー作成
gcloud builds triggers create github \
  --repo-name=web-app-temp \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=api/cloudbuild.yaml \
  --name=web-app-api-trigger
```

mainブランチへのプッシュで自動デプロイが実行されます。

### Google Cloud Run デプロイ（手動）

#### 前提条件
- Google Cloud SDK インストール済み
- プロジェクトの課金有効化
- 必要なAPI有効化（Cloud Run, Cloud Build, Secret Manager）

#### デプロイコマンド

```bash
# 1. サービスアカウント作成
npm run setup:gcp  # 自動セットアップスクリプト

# 2. APIサービスのデプロイ（認証必須）
gcloud run deploy web-app-api \
  --source=./api \
  --region=asia-northeast1 \
  --no-allow-unauthenticated \
  --service-account=api-sa@PROJECT_ID.iam.gserviceaccount.com

# 3. Webサービスのデプロイ（公開）
gcloud run deploy web-app-web \
  --source=./web \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --service-account=web-sa@PROJECT_ID.iam.gserviceaccount.com \
  --update-env-vars="API_URL=https://web-app-api-xxx.run.app"
```

### Secret Manager 設定

```bash
# シークレット作成
echo -n "your-secret-value" | gcloud secrets create STRIPE_SECRET_KEY --data-file=-

# Cloud Runサービスにシークレットを設定
gcloud run services update web-app-api \
  --update-secrets=STRIPE_SECRET_KEY=STRIPE_SECRET_KEY:latest
```

### API Gateway 設定（Stripe Webhook用）

Cloud Runの`--no-allow-unauthenticated`設定を維持しながら、Stripeからのwebhookを受信するために必須の構成です。

```bash
# 1. API Gateway用サービスアカウント作成
gcloud iam service-accounts create web-app-stripe-gw-sa \
  --display-name="Stripe Webhook Gateway Service Account"

# 2. Cloud Runへのアクセス権限付与
gcloud run services add-iam-policy-binding web-app-api \
  --member="serviceAccount:web-app-stripe-gw-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=asia-northeast1

# 3. API Gatewayデプロイ
gcloud api-gateway api-configs create stripe-webhook-config \
  --api=stripe-webhook-api \
  --openapi-spec=api-gateway-stripe-webhook/openapi2-run.yaml \
  --project=PROJECT_ID \
  --backend-auth-service-account=web-app-stripe-gw-sa@PROJECT_ID.iam.gserviceaccount.com
```

**なぜ必要か：**
- Cloud RunのAPIは外部からの直接アクセスを拒否（セキュリティ）
- Stripeはwebhookを送信する際、Google認証トークンを付与できない
- API Gatewayが公開エンドポイントとして機能し、認証を代行

## Development Notes

### 🚀 Quick Start
```bash
# 1. 環境変数設定
# - web/.env.local に NEXT_PUBLIC_* を設定
# - api/.env に DATABASE_URL / Stripe / Google OAuth 等を設定

# 2. 依存関係インストール
npm install               # ルート（スクリプト/フック用）
cd web && npm install     # Web
cd ../api && npm install  # API
cd ..

# 3. Supabase 起動（初回のみ）
npm run supabase:start

# 4. データベースセットアップ（Drizzle）
npm run db:push   # スキーマ適用
npm run db:seed   # シードデータ投入

# 5. 開発環境起動
npm run dev       # API と Web を同時起動

# 6. API クライアント生成（API 起動後）
npm run gen:api
```

### ポート設定

#### デフォルトポート
- **本番環境**: 固定ポート使用
  - Web: 3000
  - API: 8080

#### 開発環境でのポート変更
開発環境では環境変数でポートを変更可能です：

```bash
# .envファイルに追加
DEV_WEB_PORT=3001  # Webアプリのポート変更
DEV_API_PORT=8081  # APIサーバーのポート変更

# 起動
npm run dev  # 設定したポートで起動
```

複数プロジェクトを並行開発する場合に便利です。

### Port Usage

#### 本番環境（固定）
- 3000: Frontend (Next.js)
- 8080: API Server (Hono)

#### 開発環境（カスタマイズ可能）
- 3000: Frontend (Next.js) - `DEV_WEB_PORT`で変更可能
- 8080: API Server (Hono) - `DEV_API_PORT`で変更可能

#### Supabase Local
- 54321: Supabase Studio
- 54322: Supabase DB
- 54323: Supabase Auth

### Testing Workflow
1. **Lint & Format**: `npm run format && npm run lint`
2. **Type Check**: `npm run typecheck`（または各パッケージで `npm run typecheck`）
3. **API Integration**: `npm run gen:api` で最新の型定義とクライアント生成

### Code Quality Rules
- **IMPORTANT**: 変更後は `npm run format` と `npm run lint` を実行してコード品質を維持
- Biome による自動フォーマット/リントを活用（各パッケージでも同名スクリプトあり）
- pre-commit フックで `web` と `api` の型チェックを実行（`.lefthook.yml`）

## Future Enhancements
- メール通知システム（SendGrid/Resend連携）
- PWA対応（オフライン機能、プッシュ通知）
- テスト環境（Vitest, Playwright）
- モニタリング・分析（Sentry, Google Analytics）
- 多要素認証（2FA）
- APIレート制限の強化
- ユーザー分析ダッシュボード
- AIチャット機能（Claude/OpenAI API）
- リアルタイム通信（WebSocket/SSE）
- バックグラウンドジョブ（BullMQ）
