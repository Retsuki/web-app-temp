# ズボラエンジニア システム設計書

## 概要
<!-- サービスの概要 -->

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
```

## ディレクトリ構造

### Frontend (`/web/`)
<!-- web_app_tempの構造に準拠 -->

### Backend (`/api/`)
<!-- web_app_tempの構造に準拠 -->

## データベース設計

### Drizzle ORM スキーマ定義 (`/api/src/drizzle/db/schema.ts`)

```typescript
import { relations, sql } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, text, timestamp, uuid, varchar, boolean, date } from 'drizzle-orm/pg-core'

// テーブル定義をここに記載

```

## API設計

### エンドポイント一覧

#### リソース管理
- `GET /api/v1/resources` - 一覧取得
- `POST /api/v1/resources` - 作成
- `GET /api/v1/resources/:id` - 詳細取得
- `PUT /api/v1/resources/:id` - 更新
- `DELETE /api/v1/resources/:id` - 削除

### リクエスト/レスポンス例

```typescript
// Request
{
  "field": "value"
}

// Response
{
  "id": "uuid",
  "field": "value",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

## 開発フェーズ

### Phase 1: 基本機能実装（MVP）
- [ ] 基本CRUD機能
- [ ] 認証機能
- [ ] 基本UI実装

### Phase 2: 追加機能実装
- [ ] 決済機能統合
- [ ] 高度な機能追加

### Phase 3: 最適化・拡張
- [ ] パフォーマンス最適化
- [ ] スケーラビリティ向上

## セキュリティ考慮事項

1. **認証・認可**
   - Supabase Auth利用
   - RLSによるアクセス制御

2. **データ保護**
   - 機密情報の暗号化
   - セキュアな通信

## モニタリング・ログ

1. **アプリケーションモニタリング**
   - エラー率
   - レスポンスタイム
   - 使用状況

2. **インフラモニタリング**
   - リソース使用率
   - コスト管理

