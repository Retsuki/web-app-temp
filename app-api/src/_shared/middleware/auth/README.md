# 認証ミドルウェア

プラットフォームごとに分離された認証ミドルウェアを提供します。

## ディレクトリ構造

```
auth/
├── supabase/           # Supabase認証
│   ├── auth-handler.ts # Supabaseトークン検証
│   ├── middleware.ts   # Supabaseミドルウェア
│   ├── utils.ts        # トークン抽出ユーティリティ
│   └── index.ts        # エクスポート
├── cloud-run/          # Cloud Run認証
│   ├── google-auth.ts  # Google IDトークン検証
│   ├── middleware.ts   # Cloud Runミドルウェア
│   └── index.ts        # エクスポート
├── types.ts            # 共通型定義
└── index.ts            # メインエクスポート
```

## 使用方法

### デフォルト（ハイブリッドモード）

```typescript
import { authMiddleware } from '../middleware/auth/index.js'

// Cloud Run環境を自動検出し、適切な認証方式を使用
app.use(authMiddleware)
```

### プラットフォーム固有の認証

```typescript
import { createAuthMiddleware } from '../middleware/auth/index.js'

// Supabaseのみ
const supabaseAuth = createAuthMiddleware({ platform: 'supabase' })

// Cloud Runのみ
const cloudRunAuth = createAuthMiddleware({ platform: 'cloud-run' })

// ハイブリッド（自動検出無効）
const hybridAuth = createAuthMiddleware({ 
  platform: 'hybrid',
  autoDetectCloudRun: false 
})
```

## 認証フロー

### ハイブリッドモード（デフォルト）
1. Cloud Run環境を検出した場合:
   - Google IDトークン認証を試行
   - 失敗した場合はSupabase認証にフォールバック
2. それ以外の環境:
   - Supabase認証のみ使用

### Supabase認証
1. X-Supabase-Tokenヘッダーを確認
2. Cookieからトークンを取得
3. Authorizationヘッダー（Bearer）からトークンを取得
4. JWTトークンを検証

### Cloud Run認証
1. Google IDトークンを検証
2. X-Supabase-Tokenヘッダーがある場合は、実際のユーザー情報を取得
3. ヘッダーがない場合は、サービスアカウントとして認証

## 環境変数

### 必須
- `SUPABASE_JWT_SECRET`: Supabase JWTトークンの検証に使用

### Cloud Run環境
- `K_SERVICE`: Cloud Run環境の自動検出に使用
- `API_URL`: Google IDトークンのaudience検証に使用（オプション）

## エラーハンドリング

すべての認証エラーは`AppHTTPException`として投げられ、グローバルエラーハンドラーで処理されます。

- 401: 認証失敗（トークンなし、無効なトークン）
- 500: 設定エラー（JWT_SECRET未設定など）