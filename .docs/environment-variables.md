# 環境変数の設定ガイド

このプロジェクトで使用する環境変数の一覧と設定方法を説明します。

## 環境変数ファイルの構成

```
web-app-temp/
├── web/
│   ├── .env.local          # Next.js用のローカル環境変数
│   └── .env.production     # 本番環境用（作成する必要があります）
├── api/
│   └── .env                # API用の環境変数
└── .env                    # Supabase CLI用（ルートディレクトリ）
```

## Next.js (Frontend) 環境変数

### `/web/.env.local`

```bash
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]

# サイトURL（Google OAuth認証のリダイレクトに使用）
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# 本番環境では以下のように設定
# NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### 環境変数の取得方法

1. **Supabase URL と Anon Key**:
   - [Supabase Dashboard](https://app.supabase.com/) にログイン
   - プロジェクトを選択
   - 「Settings」→「API」
   - `URL` と `anon public` キーをコピー

## API (Backend) 環境変数

### `/api/.env`

```bash
# ポート設定
PORT=3001

# データベース接続
DATABASE_URL=postgresql://postgres:postgres@localhost:54321/postgres

# Supabase設定（サーバーサイド用）
SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
SUPABASE_SERVICE_KEY=[YOUR_SERVICE_KEY]  # 注意: これは秘密鍵です！

# ログレベル
LOG_LEVEL=info  # development | production で自動切り替え
```

### Service Keyの取得方法

⚠️ **警告**: Service Keyは強力な権限を持つため、絶対にクライアントサイドで使用しないでください。

1. Supabase Dashboard → Settings → API
2. `service_role` キーをコピー（このキーは行レベルセキュリティをバイパスします）

## Supabase CLI 環境変数

### `/.env` (ルートディレクトリ)

```bash
# Google OAuth設定（ローカル開発用）
# supabase/config.toml で参照される環境変数
GOOGLE_CLIENT_ID=[YOUR_GOOGLE_CLIENT_ID]
GOOGLE_CLIENT_SECRET=[YOUR_GOOGLE_CLIENT_SECRET]

# Supabase プロジェクト設定（リモート接続時に必要）
# SUPABASE_PROJECT_ID=[YOUR_PROJECT_ID]
# SUPABASE_ACCESS_TOKEN=[YOUR_ACCESS_TOKEN]
```

**重要**: これらの環境変数は `supabase/config.toml` の以下の設定で参照されます：

```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
skip_nonce_check = true
```

## 環境変数の命名規則

### Next.js
- `NEXT_PUBLIC_` プレフィックス: ブラウザで使用可能（公開情報のみ）
- プレフィックスなし: サーバーサイドのみ（秘密情報OK）

### セキュリティレベル別の分類

| 変数名 | 公開可否 | 使用場所 | 説明 |
|--------|----------|----------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ 公開可 | Frontend | SupabaseプロジェクトのURL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ 公開可 | Frontend | 公開用の匿名キー |
| `SUPABASE_SERVICE_KEY` | ❌ 秘密 | Backend | 管理者権限のキー |
| `DATABASE_URL` | ❌ 秘密 | Backend | データベース接続文字列 |
| `GOOGLE_CLIENT_SECRET` | ❌ 秘密 | Backend | Google OAuth シークレット |

## 開発環境のセットアップ

### 1. 環境変数ファイルの作成

```bash
# Frontend
cd web
cp .env.local.example .env.local  # サンプルファイルがある場合
# または
touch .env.local

# API
cd ../api
touch .env

# Root (Supabase CLI)
cd ..
touch .env
```

### 2. .gitignoreの確認

以下のファイルがgitignoreに含まれていることを確認:

```gitignore
# 環境変数
.env
.env.local
.env.production
.env*.local

# Supabase
**/supabase/.env
```

## 本番環境へのデプロイ

### Vercel (Next.js)

1. Vercelダッシュボードでプロジェクトを選択
2. Settings → Environment Variables
3. 各環境変数を追加（`NEXT_PUBLIC_`プレフィックスを忘れずに）

### Railway / Render (API)

1. サービスの環境変数設定セクションへ
2. 必要な環境変数を追加
3. `NODE_ENV=production` を設定

## トラブルシューティング

### 環境変数が読み込まれない

1. **Next.js**: 
   - サーバーを再起動 (`npm run dev`)
   - `NEXT_PUBLIC_` プレフィックスを確認

2. **API**:
   - dotenvが正しくインストールされているか確認
   - `.env`ファイルのパスが正しいか確認

### Supabaseの接続エラー

1. URLとキーが正しくコピーされているか確認
2. 余分なスペースや改行が含まれていないか確認
3. Supabaseプロジェクトが一時停止していないか確認

## ベストプラクティス

1. **環境変数の管理**
   - パスワードマネージャーや安全な場所に保管
   - チーム間で安全に共有（1Password、環境変数管理ツールなど）

2. **ローテーション**
   - 定期的にキーをローテーション
   - 漏洩の疑いがある場合は即座に再生成

3. **最小権限の原則**
   - 各環境・サービスに必要最小限の権限のみ付与
   - Service Keyの使用は最小限に

4. **環境の分離**
   - 開発、ステージング、本番で異なるキーを使用
   - 本番のキーは本番環境でのみ使用