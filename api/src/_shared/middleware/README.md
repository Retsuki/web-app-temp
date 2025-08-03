# ミドルウェア

APIで使用される共通ミドルウェアのディレクトリ構造

## ディレクトリ構成

```
middleware/
├── auth/                    # 認証ミドルウェア
│   ├── supabase/           # Supabase認証
│   ├── cloud-run/          # Google Cloud Run認証
│   ├── cloudflare/         # Cloudflare Edge認証
│   ├── types.ts            # 共通型定義
│   └── index.ts            # メインエクスポート
├── cors/                    # CORS設定
│   └── index.ts            # CORSミドルウェア
├── service-container/       # DIコンテナ
│   ├── container.ts        # ServiceContainerクラス
│   ├── middleware.ts       # 初期化ミドルウェア
│   └── index.ts            # エクスポート
└── README.md               # このファイル
```

## 使用方法

### 認証ミドルウェア

```typescript
import { authMiddleware } from '../middleware/auth/index.js'

// デフォルト（ハイブリッドモード）
app.use(authMiddleware)

// プラットフォーム固有のミドルウェアを直接使用
import { 
  supabaseAuthMiddleware,
  cloudRunAuthMiddleware,
  cloudflareEdgeAuthMiddleware 
} from '../middleware/auth/index.js'

app.use(supabaseAuthMiddleware)  // Supabaseのみ
app.use(cloudRunAuthMiddleware)  // Cloud Runのみ
app.use(cloudflareEdgeAuthMiddleware)  // Cloudflareのみ
```

### CORSミドルウェア

```typescript
import { corsMiddleware } from '../middleware/cors/index.js'

app.use(corsMiddleware)
```

### DIコンテナミドルウェア

```typescript
import { serviceContainerMiddleware } from '../middleware/service-container/index.js'

app.use(serviceContainerMiddleware)
```

## 詳細

各ミドルウェアの詳細な説明は、それぞれのディレクトリ内のREADMEを参照してください。

- [認証ミドルウェア](./auth/README.md)
- DIコンテナ（準備中）