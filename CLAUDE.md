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
npm run lint        # Biomeでリント
npm run format      # Biomeでフォーマット
npm run check       # Biomeでチェック
npm run check:apply # Biomeでチェックと修正

# APIスキーマ生成
npm run gen:api     # OpenAPIスキーマからTypeScript型定義を生成
npm run api:schema  # OpenAPIドキュメント取得と型生成を一括実行
npm run fetch:openapi # OpenAPIドキュメントを取得のみ
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
│   │   │   └── page.tsx            # ホームページ
│   │   ├── /components/
│   │   │   ├── /ui/                # shadcn/uiコンポーネント
│   │   │   └── /app/               # カスタムコンポーネント
│   │   │       ├── /auth/          # 認証関連
│   │   │       ├── /button/        # ボタンコンポーネント
│   │   │       └── /input/         # フォーム入力コンポーネント
│   │   └── /lib/
│   │       ├── /auth/              # 認証関連ユーティリティ
│   │       └── /supabase/          # Supabaseクライアント
│   └── middleware.ts               # 認証ミドルウェア
│
├── /api/                           # バックエンドAPIサーバー
│   ├── /src/
│   │   ├── /drizzle/               # データベース関連
│   │   │   ├── /db/
│   │   │   │   ├── schema.ts      # データベーススキーマ
│   │   │   │   ├── database.ts    # データベース接続
│   │   │   │   └── /seed/         # シードデータ
│   │   │   └── /migrations/       # マイグレーションファイル
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

#### UIコンポーネント
- **FormInput**: React Hook Form対応の入力コンポーネント
- **PrimaryButton**: プライマリーアクションボタン
- **OutlineButton**: セカンダリーアクションボタン
- **GoogleButton**: Google認証専用ボタン

#### カラーシステム
- **Primary Color**: Mindaro系の緑黄色 (#90d80a)
- **Secondary Color**: 深緑色 (#44670d)
- **ダークモード対応**: 自動切り替え対応

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

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Import Aliases
- `@/*` - `/web/src/*` のエイリアス

### API Architecture

#### Feature-based Modular Architecture
- 機能ごとにモジュールを分割
- 各機能は独立したコンテナを持つ
- ユースケース単位でビジネスロジックを実装

#### Service Container Pattern
- DIコンテナによる依存性注入
- ミドルウェアで一元的に初期化
- テスタビリティの向上

#### OpenAPI Integration
- Hono Zod OpenAPIによる型安全なAPI定義
- 自動的なドキュメント生成
- フロントエンドとの型共有
- APIドキュメント: http://localhost:8080/api/v1/doc

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

## Future Enhancements
- 決済システム（Stripe連携）
- メール通知システム
- ファイルアップロード機能
- 多言語対応（i18n）
- PWA対応
- テスト環境（Jest, Playwright）
- CI/CD パイプライン
- モニタリング・分析