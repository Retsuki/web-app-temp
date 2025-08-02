# Web用サービスアカウントの作成手順

## 前提条件
- Google Cloud SDKがインストール済み
- 適切な権限を持つGoogleアカウントでログイン済み
- プロジェクトが設定済み

## 1. プロジェクトIDの設定

```bash
# 現在のプロジェクトIDを確認
gcloud config get-value project

# プロジェクトIDを環境変数に設定
export PROJECT_ID=$(gcloud config get-value project)
```

## 2. Web用サービスアカウントの作成

### サービスアカウントを作成

```bash
# web-sa という名前でサービスアカウントを作成
gcloud iam service-accounts create web-sa \
  --display-name="Web Frontend Service Account" \
  --description="Service account for Web (Next.js) Cloud Run service" \
  --project=$PROJECT_ID
```

### 作成されたサービスアカウントを確認

```bash
# サービスアカウントが作成されたか確認
gcloud iam service-accounts list --project=$PROJECT_ID | grep web-sa

# 詳細情報を確認
gcloud iam service-accounts describe web-sa@$PROJECT_ID.iam.gserviceaccount.com
```

## 3. APIサービスへのアクセス権限設定

### 既存のCloud Runサービスを確認

```bash
# デプロイ済みのCloud Runサービス一覧を確認
gcloud run services list --region=asia-northeast1
```

### APIサービスへのInvoker権限を付与

```bash
# APIサービスに対してweb-saがアクセスできるように権限を付与
gcloud run services add-iam-policy-binding web-app-api \
  --member="serviceAccount:web-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=asia-northeast1 \
  --project=$PROJECT_ID
```

**注意**: APIサービスがまだデプロイされていない場合は、APIデプロイ後にこのコマンドを実行してください。

### 権限が付与されたか確認

```bash
# APIサービスのIAMポリシーを確認
gcloud run services get-iam-policy web-app-api \
  --region=asia-northeast1 \
  --project=$PROJECT_ID
```

## 4. Cloud Build設定への反映

Web側もCloud Runにデプロイする場合は、`web/cloudbuild.yaml`にサービスアカウントを指定します：

```yaml
# web/cloudbuild.yaml の gcloud run deploy ステップに追加
- '--service-account'
- 'web-sa@${PROJECT_ID}.iam.gserviceaccount.com'
```

完全な例：

```yaml
steps:
  # ... 既存のビルドステップ ...
  
  # Cloud Run へのデプロイ
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: gcloud
    args:
      - 'run'
      - 'deploy'
      - 'web-app-frontend'
      - '--image'
      - 'gcr.io/$PROJECT_ID/web-app-frontend:$COMMIT_SHA'
      - '--region'
      - 'asia-northeast1'
      - '--platform'
      - 'managed'
      - '--service-account'
      - 'web-sa@${PROJECT_ID}.iam.gserviceaccount.com'
      - '--allow-unauthenticated'
```

## 5. 環境変数の設定

Webアプリケーションから内部APIを呼び出す場合、環境変数でAPIのURLを設定します：

```bash
# Cloud Run サービスのURLを取得
API_URL=$(gcloud run services describe web-app-api \
  --region=asia-northeast1 \
  --format='value(status.url)')

# Webサービスに環境変数を設定
gcloud run services update web-app-frontend \
  --update-env-vars="API_URL=$API_URL" \
  --region=asia-northeast1
```

## トラブルシューティング

### サービスアカウントが見つからない場合

```bash
# サービスアカウントの完全なリストを確認
gcloud iam service-accounts list --project=$PROJECT_ID
```

### APIへのアクセスが拒否される場合

```bash
# web-saに付与された権限を確認
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:web-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

### Cloud Runサービス間の通信が失敗する場合

1. サービスアカウントがCloud Runサービスに正しく設定されているか確認
2. APIサービスのIAMポリシーにweb-saが含まれているか確認
3. ネットワークポリシーやファイアウォールルールを確認

## 次のステップ

- Cloud Build権限の設定
- Secret Managerの設定（必要に応じて）
- 本番環境へのデプロイ準備