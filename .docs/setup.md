# セットアップガイド

## 前提条件

- Node.js 18以上
- npm または yarn
- Supabase CLI（ローカル開発用）

## 初期セットアップ

### 1. リポジトリのクローン
```bash
git clone [repository-url]
cd web_app_temp
```

### 2. 依存関係のインストール
```bash
# ルートディレクトリで
npm install

# Webアプリケーション
cd web
npm install

# APIサーバー
cd ../api
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env`を作成：
```bash
cp .env.example .env
```

必須の環境変数：
```bash
# Supabase（ローカル開発用のデフォルト値）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Database
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres

# API
API_URL=http://localhost:3001

# Google OAuth（オプション - Google認証を使用する場合）
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:54321/auth/v1/callback

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 4. Supabaseローカル環境の起動

Supabase CLIのインストール：
```bash
# macOS
brew install supabase/tap/supabase

# その他のOS
# https://supabase.com/docs/guides/cli を参照
```

Supabaseを起動：
```bash
supabase start
```

起動後、以下のようなURLとキーが表示されます：
```
API URL: http://127.0.0.1:54321
Studio URL: http://127.0.0.1:54323
```

### 5. データベースのセットアップ

```bash
cd api

# マイグレーションの実行
npm run db:push

# シードデータの投入（オプション）
npm run db:seed
```

### 6. アプリケーションの起動

ターミナルを2つ開いて、それぞれで以下を実行：

**Webアプリケーション:**
```bash
cd web
npm run dev
```
→ http://localhost:3000 でアクセス可能

**APIサーバー:**
```bash
cd api
npm run dev
```
→ http://localhost:3001 でアクセス可能

## 開発ツール

### Supabase Studio
データベース管理UIにアクセス：
```
http://127.0.0.1:54323
```

### メールテスト（Inbucket）
開発環境でのメール確認：
```
http://127.0.0.1:54324
```

## よくある問題と解決策

### ポートが既に使用されている
```bash
# Supabaseを完全に停止
supabase stop --backup

# 特定のポートを使用しているプロセスを確認
lsof -i :54321
```

### データベース接続エラー
1. Supabaseが起動しているか確認: `supabase status`
2. DATABASE_URLが正しいか確認
3. Supabaseを再起動: `supabase stop && supabase start`

### 環境変数が読み込まれない
1. `.env`ファイルがルートディレクトリにあるか確認
2. 環境変数名が正しいか確認（`NEXT_PUBLIC_`プレフィックスに注意）
3. アプリケーションを再起動

## 本番環境へのデプロイ

### Supabaseプロジェクトの作成
1. [Supabase Dashboard](https://app.supabase.com)でプロジェクトを作成
2. プロジェクトのURL、Anonキー、Service Roleキーを取得
3. 本番環境の環境変数を設定

### Vercelへのデプロイ（推奨）
1. VercelにGitHubリポジトリを接続
2. 環境変数を設定
3. デプロイ設定：
   - Framework Preset: Next.js
   - Root Directory: `web`
   - Build Command: `npm run build`
   - Output Directory: `.next`

### APIサーバーのデプロイ
- Vercel Functions
- Railway
- Render
- その他のNode.js対応ホスティング

詳細は各プラットフォームのドキュメントを参照してください。