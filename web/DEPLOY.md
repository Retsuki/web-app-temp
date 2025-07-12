# Cloud Run へのデプロイ手順

## 前提条件

1. Google Cloud SDK がインストールされていること
2. Google Cloud プロジェクトが作成されていること
3. 必要な API が有効化されていること：
   - Cloud Build API
   - Cloud Run API
   - Container Registry API

## 環境変数の設定

以下の環境変数が必要です：

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase プロジェクトの URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase の匿名キー
- `NEXT_PUBLIC_SITE_URL`: サイトの URL (例: https://your-app.run.app)
- `API_URL`: バックエンド API の URL
- `NEXT_PUBLIC_API_URL`: フロントエンドから参照する API の URL

## デプロイ方法

### 1. Google Cloud にログイン

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 2. Cloud Build を使用してデプロイ

プロジェクトのルートディレクトリから実行：

```bash
gcloud builds submit \
  --config=web/cloudbuild.yaml \
  --substitutions=\
_NEXT_PUBLIC_SUPABASE_URL="your-supabase-url",\
_NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key",\
_NEXT_PUBLIC_SITE_URL="https://your-app-url.run.app",\
_API_URL="https://your-api-url.run.app",\
_NEXT_PUBLIC_API_URL="https://your-api-url.run.app",\
_REGION="asia-northeast1"
```

### 3. 手動でのデプロイ（ローカルでビルド）

```bash
# Docker イメージをビルド
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="your-supabase-url" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key" \
  --build-arg NEXT_PUBLIC_SITE_URL="https://your-app-url.run.app" \
  --build-arg API_URL="https://your-api-url.run.app" \
  -t gcr.io/YOUR_PROJECT_ID/web-app:latest \
  -f web/Dockerfile \
  web

# イメージをプッシュ
docker push gcr.io/YOUR_PROJECT_ID/web-app:latest

# Cloud Run にデプロイ
gcloud run deploy web-app \
  --image gcr.io/YOUR_PROJECT_ID/web-app:latest \
  --region asia-northeast1 \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --set-env-vars "NEXT_PUBLIC_SUPABASE_URL=your-supabase-url" \
  --set-env-vars "NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key" \
  --set-env-vars "NEXT_PUBLIC_SITE_URL=https://your-app-url.run.app" \
  --set-env-vars "API_URL=https://your-api-url.run.app" \
  --set-env-vars "NEXT_PUBLIC_API_URL=https://your-api-url.run.app"
```

## 注意事項

1. **ポート設定**: Cloud Run はデフォルトでポート 8080 を使用します。Dockerfile で設定済みです。

2. **メモリとCPU**: 
   - 開発環境: 512Mi メモリ、1 CPU
   - 本番環境: トラフィックに応じて調整

3. **スケーリング**:
   - 最小インスタンス: 0（コールドスタート許容）
   - 最大インスタンス: 10（必要に応じて調整）

4. **セキュリティ**:
   - 本番環境では環境変数を Secret Manager で管理することを推奨
   - Cloud Run サービスアカウントの権限を最小限に

## トラブルシューティング

### ビルドエラー
- `package-lock.json` が最新か確認
- Node.js のバージョンが Dockerfile と一致しているか確認

### デプロイエラー
- Cloud Run API が有効になっているか確認
- サービスアカウントに必要な権限があるか確認

### 実行時エラー
- Cloud Run のログを確認: `gcloud run logs read --service web-app`
- 環境変数が正しく設定されているか確認