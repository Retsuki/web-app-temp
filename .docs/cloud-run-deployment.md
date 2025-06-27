# Cloud Runデプロイメントガイド

## 概要
このガイドでは、WebアプリケーションとAPIサーバーをGoogle Cloud Runに別々にデプロイする手順を説明します。

## 前提条件
- Google Cloud プロジェクトの作成
- Google Cloud CLIのインストール（`gcloud`）
- Docker環境
- Artifact Registryの有効化

## アーキテクチャ
```
┌─────────────┐     ┌─────────────┐     ┌──────────────┐
│  Cloud Run  │────▶│  Cloud Run  │────▶│   Supabase   │
│    (Web)    │     │    (API)    │     │    Cloud     │
└─────────────┘     └─────────────┘     └──────────────┘
   Next.js             Hono API         Auth & Database
```

## 初期設定

### 1. Google Cloudプロジェクトの設定
```bash
# プロジェクトIDを設定
export PROJECT_ID=your-project-id

# プロジェクトを設定
gcloud config set project $PROJECT_ID

# 必要なAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. Artifact Registryの作成
```bash
# リポジトリを作成
gcloud artifacts repositories create web-app-temp \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Web App Template Docker images"

# 認証を設定
gcloud auth configure-docker asia-northeast1-docker.pkg.dev
```

## Webアプリケーションのデプロイ

### 1. Dockerイメージのビルドとプッシュ
```bash
cd web

# イメージをビルド
docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  --build-arg NEXT_PUBLIC_SITE_URL=https://your-app.run.app \
  --build-arg API_URL=https://your-api.run.app \
  -t asia-northeast1-docker.pkg.dev/$PROJECT_ID/web-app-temp/web:latest .

# イメージをプッシュ
docker push asia-northeast1-docker.pkg.dev/$PROJECT_ID/web-app-temp/web:latest
```

### 2. Cloud Runにデプロイ
```bash
gcloud run deploy web-app-web \
  --image asia-northeast1-docker.pkg.dev/$PROJECT_ID/web-app-temp/web:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --max-instances 10 \
  --set-env-vars="NODE_ENV=production"
```

## APIサーバーのデプロイ

### 1. Dockerイメージのビルドとプッシュ
```bash
cd ../api

# イメージをビルド
docker build -t asia-northeast1-docker.pkg.dev/$PROJECT_ID/web-app-temp/api:latest .

# イメージをプッシュ
docker push asia-northeast1-docker.pkg.dev/$PROJECT_ID/web-app-temp/api:latest
```

### 2. Cloud Runにデプロイ
```bash
gcloud run deploy web-app-api \
  --image asia-northeast1-docker.pkg.dev/$PROJECT_ID/web-app-temp/api:latest \
  --platform managed \
  --region asia-northeast1 \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --max-instances 10 \
  --set-env-vars="NODE_ENV=production,DATABASE_URL=postgresql://...,SUPABASE_SERVICE_ROLE_KEY=..."
```

## 環境変数の管理

### Web環境変数
Cloud Runコンソールまたは`gcloud`コマンドで設定：
```bash
gcloud run services update web-app-web \
  --update-env-vars="NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co,NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
```

### API環境変数
```bash
gcloud run services update web-app-api \
  --update-env-vars="DATABASE_URL=postgresql://...,SUPABASE_SERVICE_ROLE_KEY=...,ALLOWED_ORIGINS=https://web-app-web-xxx.run.app"
```

## セキュリティ設定

### 1. CORS設定
APIの環境変数で許可するオリジンを設定：
```
ALLOWED_ORIGINS=https://web-app-web-xxx.run.app
```

### 2. Secret Managerの使用（推奨）
```bash
# シークレットを作成
echo -n "your-database-url" | gcloud secrets create database-url --data-file=-
echo -n "your-service-role-key" | gcloud secrets create supabase-service-role-key --data-file=-

# Cloud Runでシークレットを使用
gcloud run services update web-app-api \
  --set-secrets="DATABASE_URL=database-url:latest,SUPABASE_SERVICE_ROLE_KEY=supabase-service-role-key:latest"
```

### 3. サービス間通信
内部通信のみ許可する場合：
```bash
# APIを内部通信のみに制限
gcloud run services update web-app-api --no-allow-unauthenticated

# Webアプリにサービスアカウントを設定
gcloud run services update web-app-web \
  --service-account=web-app-sa@$PROJECT_ID.iam.gserviceaccount.com
```

## CI/CD設定

### GitHub Actionsの例
`.github/workflows/deploy.yml`:
```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: asia-northeast1

jobs:
  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: auth
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v1
      
      - name: Configure Docker
        run: gcloud auth configure-docker ${{ env.REGION }}-docker.pkg.dev
      
      - name: Build and Push
        run: |
          cd web
          docker build . -t ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/web-app-temp/web:${{ github.sha }}
          docker push ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/web-app-temp/web:${{ github.sha }}
      
      - name: Deploy
        run: |
          gcloud run deploy web-app-web \
            --image ${{ env.REGION }}-docker.pkg.dev/${{ env.PROJECT_ID }}/web-app-temp/web:${{ github.sha }} \
            --region ${{ env.REGION }}

  deploy-api:
    runs-on: ubuntu-latest
    steps:
      # 同様の手順でAPIをデプロイ
```

## モニタリング

### Cloud Loggingの確認
```bash
# Webアプリのログ
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=web-app-web" --limit 50

# APIのログ
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=web-app-api" --limit 50
```

### メトリクスの確認
Cloud Consoleで以下を監視：
- リクエスト数
- レイテンシ
- エラー率
- CPU/メモリ使用率

## トラブルシューティング

### 一般的な問題

1. **コールドスタート対策**
   - 最小インスタンス数を設定
   ```bash
   gcloud run services update web-app-web --min-instances 1
   ```

2. **メモリ不足エラー**
   - メモリ割り当てを増やす
   ```bash
   gcloud run services update web-app-web --memory 1Gi
   ```

3. **CORS エラー**
   - API側の`ALLOWED_ORIGINS`環境変数を確認
   - プリフライトリクエストの処理を確認

4. **環境変数が反映されない**
   - ビルド時に必要な環境変数は`--build-arg`で指定
   - 実行時の環境変数は`--set-env-vars`で指定

## コスト最適化

1. **リクエストベースの課金**
   - 最小インスタンス数は必要最小限に
   - 適切なCPU/メモリサイズを選択

2. **Cloud CDN の活用**
   - 静的アセットのキャッシュ
   - グローバル配信の高速化

3. **自動スケーリング設定**
   ```bash
   gcloud run services update web-app-web \
     --min-instances 0 \
     --max-instances 100 \
     --concurrency 80
   ```