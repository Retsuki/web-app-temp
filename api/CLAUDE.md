# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

このドキュメントは、APIプロジェクトの開発方針、アーキテクチャ、コーディング規約を定義し、開発者とAIアシスタントが一貫した品質でコードを書けるようにするためのガイドラインです。

## プロジェクト概要

### 技術スタック
- **フレームワーク**: Hono (高速・軽量なWebフレームワーク)
- **ランタイム**: Node.js
- **言語**: TypeScript
- **データベース**: PostgreSQL (Supabase経由)
- **ORM**: Drizzle ORM
- **バリデーション**: Zod + @hono/zod-openapi
- **ロギング**: Pino
- **コード品質**: Biome

### 主要な設計原則
1. **シンプルさを保つ**: 過度な抽象化を避け、読みやすいコードを書く
2. **型安全性**: TypeScriptの型システムを最大限活用
3. **エラーハンドリング**: グローバルエラーハンドラーに委ねる
4. **凝集性**: 関連するコードは物理的に近くに配置

## アーキテクチャ

### レイヤー構造
```
┌─────────────────────────────────────────────────────────┐
│                Routes (index.ts)                         │
│                    ↓                                     │
│              Use Cases (Business Logic)                  │
│                    ↓                                     │
│            Repositories (Data Access)                    │
└─────────────────────────────────────────────────────────┘
```

### ディレクトリ構造
```
/api/src/
├── /features/                  # 機能別モジュール
│   └── /{feature}/            # 各機能ディレクトリ
│       ├── index.ts           # ルート定義とハンドラー
│       ├── container.ts       # 機能別DIコンテナ
│       ├── /use-cases/        # ユースケース別ディレクトリ
│       │   └── /{action}/
│       │       ├── route.ts   # OpenAPIルート定義
│       │       ├── dto.ts     # リクエスト/レスポンスDTO
│       │       └── use-case.ts # ビジネスロジック
│       └── /repositories/     # データアクセス層
│
├── /_shared/                   # 共通モジュール
│   ├── /middleware/
│   │   └── /service-container/ # DIコンテナ
│   │       ├── container.ts    # ServiceContainerクラス
│   │       ├── middleware.ts   # 初期化ミドルウェア
│   │       └── index.ts        # エクスポート
│   ├── /utils/
│   │   └── /error/            # エラーハンドリング
│   └── /types/                # 共通型定義
│
├── /drizzle/                   # データベース関連
│   └── /db/
│       ├── schema.ts          # テーブル定義
│       ├── database.ts        # DB接続
│       └── /seed/             # シードデータ
│
├── /constants/                 # アプリケーション定数
│   └── plans.ts               # プラン定義 (FREE, PRO, ENTERPRISE)
│
├── /lib/                       # 外部サービス統合
│   └── stripe.ts              # Stripe API クライアント
│
└── index.ts                    # エントリーポイント
```

## コーディング規約

### 1. 命名規則
- **ファイル名**: kebab-case (例: `user-profile.dto.ts`)
- **クラス名**: PascalCase (例: `UserRepository`)
- **関数・変数**: camelCase (例: `getUserProfile`)
- **定数**: UPPER_SNAKE_CASE (例: `ERROR_CODES`)

### 2. ファイル構成
```typescript
// 1. imports (外部ライブラリ → 内部モジュール)
import { z } from "@hono/zod-openapi";
import { AppHTTPException } from "../../utils/error/index.js";

// 2. 型定義
export interface UserProfile {
  id: string;
  email: string;
}

// 3. 実装
export class UserRepository {
  // ...
}
```

### 3. エラーハンドリング
```typescript
// ❌ Bad - try-catchを使わない
try {
  const user = await getUser();
} catch (error) {
  return c.json({ error: "Not found" }, 404);
}

// ✅ Good - AppHTTPExceptionを投げる
const user = await getUser();
if (!user) {
  throw new AppHTTPException(404, {
    code: ERROR_CODES.USER_NOT_FOUND,
    message: "ユーザーが見つかりません",
  });
}
```

### 4. ルート定義
```typescript
// route.ts - OpenAPIスキーマ定義
export const getUserRoute = createRoute({
  method: "get",
  path: "/users/:id",
  responses: {
    200: {
      description: "成功",
      content: {
        "application/json": {
          schema: userSchema,
        },
      },
    },
    ...errorResponses, // 共通エラーレスポンスを使用
  },
});

// index.ts - ハンドラー実装
app.openapi(getUserRoute, async (c) => {
  const { users } = c.get("services");
  const user = await users.getProfile.execute(userId);
  return c.json(user, 200);
});
```

## 開発コマンド

```bash
# 開発
npm run dev          # 開発サーバー起動 (ポート 8080)
npm run dev:build    # TypeScript型チェック（watchモード）
npm run build        # プロダクションビルド
npm run start        # プロダクションサーバー起動

# データベース
npm run db:generate  # Drizzleマイグレーション生成
npm run db:push      # データベースへマイグレーション適用
npm run db:seed      # シードデータ投入
npm run db:check     # マイグレーションの検証

# コード品質
npm run lint         # Biomeリントチェック
npm run lint:fix     # Biome自動修正

# API生成
npm run api:generate # Hygenを使用した新規API生成（対話形式）
```

## 開発フロー

### 新機能追加の手順

1. **機能ディレクトリ作成**
   ```bash
   mkdir -p src/features/posts
   ```

2. **コンテナ作成** (`container.ts`)
   ```typescript
   export class PostContainer {
     public readonly repository: PostRepository;
     public readonly createPost: CreatePostUseCase;
     
     constructor(db: Database) {
       this.repository = new PostRepository(db);
       this.createPost = new CreatePostUseCase(this.repository);
     }
   }
   ```

3. **ServiceContainerに追加** (`src/_shared/middleware/service-container/container.ts`)
   ```typescript
   export class ServiceContainer {
     public readonly users: UserContainer;
     public readonly billing: BillingContainer;
     public readonly posts: PostContainer; // 追加
     
     constructor(env: Env) {
       const db = createDatabaseConnection(env.DATABASE_URL);
       this.users = new UserContainer(db);
       this.billing = new BillingContainer(db, env);
       this.posts = new PostContainer(db); // 追加
     }
   }
   ```

4. **ユースケース実装**
   - `/use-cases/create-post/route.ts` - OpenAPI定義
   - `/use-cases/create-post/dto.ts` - 型定義
   - `/use-cases/create-post/use-case.ts` - ロジック

5. **ルート登録** (`index.ts`)
   ```typescript
   export const postsApi = (app: App) => {
     app.openapi(createPostRoute, async (c) => {
       // ハンドラー実装
     });
   };
   ```

## ベストプラクティス

### 1. DIコンテナの活用
```typescript
// ❌ Bad - 毎回初期化
const repository = new UserRepository(db);
const useCase = new GetUserUseCase(repository);

// ✅ Good - DIコンテナから取得
const { users } = c.get("services");
const profile = await users.getProfile.execute(userId);
```

### 2. 共通エラーレスポンスの使用
```typescript
// ❌ Bad - 個別定義
responses: {
  404: {
    description: "Not found",
    // ...
  }
}

// ✅ Good - 共通定義を使用
responses: {
  200: { /* ... */ },
  ...errorResponses,
}
```

### 3. 環境変数の検証
```typescript
// ServiceContainerミドルウェアで一元管理
if (!process.env.DATABASE_URL) {
  throw new AppHTTPException(500, {
    message: "DATABASE_URL is not set",
  });
}
```

### 4. 認証の実装
```typescript
// ルートハンドラーでユーザーID取得
import { validateUserId } from '../../_shared/utils/auth/index.js'

app.openapi(protectedRoute, async (c) => {
  const userId = validateUserId(c) // 認証失敗時は自動的に例外
  // ビジネスロジック実行
})
```

### 5. インポートパスの規則
```typescript
// ❌ Bad - .js拡張子なし
import { UserRepository } from './repositories/user.repository'

// ✅ Good - .js拡張子付き（ES Modules）
import { UserRepository } from './repositories/user.repository.js'
```

## データベース

### マイグレーション
```bash
# スキーマ変更後
npm run db:generate  # マイグレーション生成
npm run db:push     # データベースに適用
```

### スキーマ定義
```typescript
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at").default(sql`now()`),
});
```

## テスト

### テスト構造
```
/features/users/
├── index.ts
├── index.test.ts        # ルートテスト
├── /use-cases/
│   └── /get-profile/
│       ├── use-case.ts
│       └── use-case.test.ts
```

### テスト方針
- ユースケースは単体テスト
- リポジトリはモックを使用
- E2Eテストは主要なユーザーシナリオのみ

## セキュリティ

### 認証・認可
- Supabase Authを使用
- JWTトークンの検証は`authMiddleware`で実施
- `validateUserId(c)`でユーザーID取得

### 入力検証
- Zodスキーマで自動バリデーション
- SQLインジェクション対策はDrizzle ORMが担保

## パフォーマンス

### 最適化のポイント
1. **N+1問題の回避**: リポジトリでJOINを適切に使用
2. **キャッシング**: 将来的にRedis導入予定
3. **ページネーション**: 大量データは必ずページング

## デプロイ

### 環境変数
```env
# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...

# Stripe
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
STRIPE_FREE_PRICE_ID=...
STRIPE_PRO_PRICE_ID=...
STRIPE_ENTERPRISE_PRICE_ID=...

# External Services (Optional)
REVENUECAT_SECRET_API_KEY=...
GOOGLE_PLACES_API_KEY=...
GOOGLE_CLOUD_PROJECT_ID=...
```

### ビルド・起動
```bash
npm run build  # TypeScriptビルド
npm run start  # プロダクション起動
```

## トラブルシューティング

### よくある問題

1. **型エラー**: `npm run build`で確認
2. **DB接続エラー**: 環境変数とSupabaseの状態確認
3. **認証エラー**: トークンの有効期限確認

## 実装済み機能

### Users API (`/api/v1/users`)
- `GET /me` - ユーザープロフィール取得
- `PUT /me` - プロフィール更新
- `DELETE /me` - アカウント削除
- `POST /` - ユーザー作成（内部用）

### Billing API (`/api/v1/billing`)
- `POST /checkout` - Stripeチェックアウトセッション作成
- その他のエンドポイントは開発中

### Health Check
- `GET /api/v1/health` - サービスヘルスチェック

### OpenAPI Documentation
- `/api/v1/doc` - OpenAPIスキーマ（JSON）
- `/api/v1/ui` - Swagger UI

## 今後の拡張予定

- [ ] Stripe Webhookハンドラー
- [ ] サブスクリプション管理API
- [ ] WebSocket対応（リアルタイム機能）
- [ ] ファイルアップロード機能
- [ ] バックグラウンドジョブ（BullMQ）
- [ ] レート制限の強化
- [ ] GraphQL対応

---

このドキュメントは、プロジェクトの成長に合わせて更新してください。
質問や提案がある場合は、Issueを作成してディスカッションしましょう。