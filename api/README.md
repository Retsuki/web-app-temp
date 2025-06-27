# API Server - アーキテクチャ設計書

## 概要

このAPIサーバーは、新規アプリケーション開発を高速化するためのテンプレートです。
シンプルで保守しやすいアーキテクチャを採用し、必要十分な構造で拡張性を確保しています。

## アーキテクチャ概要

### 設計思想

```
┌─────────────────────────────────────────────────────────┐
│                Routes (index.ts)                         │
│                    ↓                                     │
│              Use Cases (Business Logic)                  │
│                    ↓                                     │
│            Repositories (Data Access)                    │
└─────────────────────────────────────────────────────────┘
```

- **エントリーポイント**: 各機能の index.ts でルート定義とハンドラーを実装
- **ビジネスロジック**: ユースケース（サービス層）
- **データアクセス**: リポジトリ（データ層）

### ディレクトリ構造

```
/api/src/
├── /features/                  # 機能別モジュール
│   ├── /users/                 # ユーザー機能
│   │   ├── index.ts            # ハンドラー実装（ルート集約）
│   │   ├── /use-cases/         # ユースケース別ディレクトリ
│   │   │   ├── /get-profile/
│   │   │   │   ├── route.ts    # GET /users/me ルート定義
│   │   │   │   ├── dto.ts      # レスポンスDTO
│   │   │   │   └── use-case.ts # プロフィール取得ロジック
│   │   │   ├── /update-profile/
│   │   │   │   ├── route.ts    # PUT /users/me ルート定義
│   │   │   │   ├── dto.ts      # リクエスト/レスポンスDTO
│   │   │   │   └── use-case.ts # プロフィール更新ロジック
│   │   │   └── /delete-account/
│   │   │       ├── route.ts    # DELETE /users/me ルート定義
│   │   │       ├── dto.ts      # リクエストDTO
│   │   │       └── use-case.ts # アカウント削除ロジック
│   │   └── /repositories/      # リポジトリ
│   │       └── user.repository.ts
│   │
│   ├── /auth/                  # 認証機能
│   │   ├── index.ts
│   │   ├── /use-cases/
│   │   └── /repositories/
│   │
│   └── /health/                # ヘルスチェック
│       └── index.ts
│
├── /infrastructure/            # インフラ層
│   ├── /database/
│   │   ├── schema.ts          # データベーススキーマ
│   │   └── connection.ts      # DB接続
│   └── /external/             # 外部サービス
│       └── supabase-auth.ts
│
├── /middleware/                # 共通ミドルウェア
│   ├── auth.middleware.ts
│   ├── validation.middleware.ts
│   ├── error-handler.middleware.ts
│   └── logger.middleware.ts
│
├── /shared/                    # 共通機能
│   ├── /errors/               # エラークラス
│   │   ├── app-error.ts
│   │   └── validation-error.ts
│   ├── /utils/                # ユーティリティ
│   │   ├── logger.ts
│   │   └── response.ts
│   └── /types/                # 共通型定義
│       └── index.ts
│
└── index.ts                    # エントリーポイント
```

## ユーザープロフィールAPI設計

### エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | /api/v1/users/me | 自分のプロフィール取得 | 必須 |
| PUT | /api/v1/users/me | プロフィール更新 | 必須 |
| DELETE | /api/v1/users/me | アカウント削除 | 必須 |
| GET | /api/v1/users/:id | 他ユーザー情報取得 | 任意 |
| GET | /api/v1/users | ユーザー一覧取得 | 任意 |

### レスポンス形式

#### 成功レスポンス
```json
{
  "success": true,
  "data": {
    // リソースデータ
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

#### エラーレスポンス
```json
{
  "success": false,
  "error": {
    "code": "USER_NOT_FOUND",
    "message": "指定されたユーザーが見つかりません",
    "details": {
      "userId": "123"
    }
  },
  "metadata": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  }
}
```

### データモデル

#### User Model
```typescript
interface User {
  id: string;                    // UUID
  email: string;                 // メールアドレス
  nickname: string;              // ニックネーム
  avatarUrl?: string;            // アバター画像URL
  bio?: string;                  // 自己紹介
  isPublic: boolean;             // プロフィール公開設定
  createdAt: Date;               // 作成日時
  updatedAt: Date;               // 更新日時
  deletedAt?: Date;              // 削除日時（論理削除）
}
```

### 実装の流れ

1. **ルート定義** (route.ts)
   - OpenAPIスキーマ定義
   - エンドポイントのパス定義
   - HTTPメソッドの指定
   - リクエスト/レスポンススキーマ定義

2. **ハンドラー実装** (index.ts)
   - リクエストの受け取り
   - 認証・認可チェック
   - ユースケースの呼び出し
   - レスポンスの返却

3. **ユースケース実行** (Use Cases)
   - ビジネスロジックの実装
   - リポジトリの呼び出し
   - エラーハンドリング

4. **データアクセス** (Repositories)
   - データベース操作
   - 外部サービス連携
   - データの変換

### 各層の責任

#### route.ts (OpenAPI定義)
- エンドポイントの仕様定義
- バリデーションスキーマ
- レスポンススキーマ
- APIドキュメント生成

#### index.ts (ハンドラー実装)
- HTTPリクエスト/レスポンスの処理
- 認証・認可
- ユースケースの呼び出し

#### Use Cases
- ビジネスロジックの実装
- トランザクション管理
- 複数リポジトリの協調

#### Repositories
- データベースアクセス
- 外部APIの呼び出し
- データの永続化

## 設計のポイント

### 1. ユースケース単位での凝集性
- 1つのユースケースに関連するroute、dto、use-caseを同じディレクトリに配置
- 機能の追加・変更・削除が1ディレクトリで完結
- 関連ファイルが物理的に近いため、開発効率が向上

### 2. 単方向の依存関係
- index.ts → Use Case → Repository の単方向フロー
- 上位層は下位層に依存するが、逆は禁止

### 3. 責任の明確化
- 各層が明確な責任を持つ
- ビジネスロジックはユースケースに集約

## セキュリティ考慮事項

1. **認証・認可**
   - Supabase Auth によるJWT認証
   - ロールベースアクセス制御 (RBAC)

2. **入力検証**
   - Zodによるスキーマバリデーション
   - SQLインジェクション対策

3. **レート制限**
   - API呼び出し回数の制限
   - DDoS攻撃の防止

4. **データ保護**
   - 個人情報の適切な暗号化
   - ログでの機密情報除外

## パフォーマンス最適化

1. **キャッシング戦略**
   - Redis によるキャッシュ層（将来実装）
   - HTTP キャッシュヘッダーの活用

2. **データベース最適化**
   - 適切なインデックス設計
   - N+1問題の回避

3. **非同期処理**
   - 重い処理のキュー化（将来実装）
   - WebSocketによるリアルタイム通信（将来実装）

## テスト戦略

1. **単体テスト**
   - ユースケースのテスト
   - ドメインロジックのテスト

2. **統合テスト**
   - APIエンドポイントのテスト
   - データベース連携のテスト

3. **E2Eテスト**
   - ユーザーシナリオベースのテスト

## 開発ガイドライン

### 新しい機能の追加手順

1. `/features/` 配下に機能名のディレクトリを作成
2. 必要なサブディレクトリを作成（routes, controllers, dto, use-cases, repositories）
3. ルート定義を実装
4. DTOを定義（リクエスト/レスポンス）
5. コントローラーを実装
6. ユースケースを実装
7. リポジトリを実装
8. テストを作成

### 実装例：新機能「投稿(posts)」を追加する場合

```
/features/posts/
├── index.ts                    # ハンドラー実装（ルート集約）
├── /use-cases/
│   ├── /create-post/
│   │   ├── route.ts           # POST /posts ルート定義
│   │   ├── dto.ts             # 作成用DTO
│   │   └── use-case.ts        # 投稿作成ロジック
│   ├── /get-posts/
│   │   ├── route.ts           # GET /posts ルート定義
│   │   ├── dto.ts             # 一覧取得用DTO
│   │   └── use-case.ts        # 投稿一覧取得ロジック
│   ├── /update-post/
│   │   ├── route.ts           # PUT /posts/:id ルート定義
│   │   ├── dto.ts             # 更新用DTO
│   │   └── use-case.ts        # 投稿更新ロジック
│   └── /delete-post/
│       ├── route.ts           # DELETE /posts/:id ルート定義
│       ├── dto.ts             # 削除用DTO
│       └── use-case.ts        # 投稿削除ロジック
└── /repositories/
    └── post.repository.ts      # 投稿リポジトリ
```

#### /use-cases/create-post/route.ts の実装例
```typescript
import { createRoute } from "@hono/zod-openapi";
import { createPostReqSchema, postResSchema } from "./dto";

export const createPostRoute = createRoute({
  tags: ["posts"],
  path: "/posts",
  method: "post",
  summary: "投稿作成",
  request: {
    body: {
      content: {
        "application/json": {
          schema: createPostReqSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "作成成功",
      content: {
        "application/json": {
          schema: postResSchema,
        },
      },
    },
  },
});
```

#### /use-cases/create-post/dto.ts の実装例
```typescript
import { z } from "@hono/zod-openapi";

export const createPostReqSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(10000),
  isPublished: z.boolean().default(false),
});

export const postResSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  authorId: z.string().uuid(),
  isPublished: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type CreatePostReq = z.infer<typeof createPostReqSchema>;
export type PostRes = z.infer<typeof postResSchema>;
```

#### index.ts の実装例
```typescript
import { createPostRoute } from "./use-cases/create-post/route";
import { getPostsRoute } from "./use-cases/get-posts/route";

export const postsApi = (app: App) => {
  // 投稿作成
  app.openapi(createPostRoute, async (c) => {
    const userId = validateUserId(c);
    const body = c.req.valid("json");
    const { createPostUseCase } = c.get("services");
    const post = await createPostUseCase.execute(userId, body);
    return c.json(post, 201);
  });

  // 投稿一覧取得
  app.openapi(getPostsRoute, async (c) => {
    const userId = validateUserId(c);
    const { getPostsUseCase } = c.get("services");
    const posts = await getPostsUseCase.execute(userId);
    return c.json({ posts });
  });
};
```

### コーディング規約

- TypeScriptの厳格な型付けを使用
- 関数は純粋関数を心がける
- エラーは適切にハンドリングし、ログに記録
- 命名規則：
  - ファイル名: kebab-case
  - クラス名: PascalCase
  - 変数・関数名: camelCase

## 今後の拡張予定

1. **GraphQL対応**
   - REST APIと並行してGraphQLエンドポイントを提供

2. **WebSocket対応**
   - リアルタイム通信機能

3. **マイクロサービス化**
   - 機能ごとのサービス分割

4. **イベント駆動アーキテクチャ**
   - ドメインイベントの非同期処理

5. **API Gateway**
   - 認証、レート制限、ルーティングの統合管理