# Google Cloud Platform サービスアカウント設定ガイド

このドキュメントでは、Web/APIアプリケーションをGoogle Cloud Runにデプロイするために必要なサービスアカウントの設定手順をまとめています。

## 概要

以下の3つのサービスアカウントを設定します：

1. **API用サービスアカウント（api-sa）** - APIサーバーがSecret Managerにアクセスするため
2. **Web用サービスアカウント（web-sa）** - WebフロントエンドがAPIサービスを呼び出すため
3. **Cloud Buildサービスアカウント** - Cloud BuildがCloud Runへのデプロイを実行するため

## 前提条件

- Google Cloud SDKがインストール済み
- 適切な権限を持つGoogleアカウントでログイン済み
- Google Cloud プロジェクトが作成済み

## 1. 初期設定

### プロジェクトの確認と設定

```bash
# 現在のプロジェクトを確認
gcloud config get-value project

# 利用可能なプロジェクトの一覧を表示
gcloud projects list

# プロジェクトを設定（必要な場合）
gcloud config set project YOUR-PROJECT-ID

# プロジェクトIDとプロジェクト番号を環境変数に設定
export PROJECT_ID=$(gcloud config get-value project)
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
```

## 2. API用サービスアカウントの設定

### 目的
APIサービスがSecret Managerから環境変数を安全に読み取れるようにします。

### サービスアカウントの作成

```bash
# api-sa という名前でサービスアカウントを作成
gcloud iam service-accounts create api-sa \
  --display-name="API Service Account" \
  --description="Service account for API Cloud Run service" \
  --project=$PROJECT_ID
```

### 必要な権限の付与

```bash
# Secret Managerから環境変数を読み取る権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:api-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 権限の確認

```bash
# api-saに付与された権限を確認
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:api-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

## 3. Web用サービスアカウントの設定

### 目的
WebフロントエンドがAPIサービスを安全に呼び出せるようにします。

### サービスアカウントの作成

```bash
# web-sa という名前でサービスアカウントを作成
gcloud iam service-accounts create web-sa \
  --display-name="Web Frontend Service Account" \
  --description="Service account for Web (Next.js) Cloud Run service" \
  --project=$PROJECT_ID
```

### APIサービスへのアクセス権限設定

```bash
# 既存のCloud Runサービスを確認
gcloud run services list --region=asia-northeast1

# APIサービスに対してweb-saがアクセスできるように権限を付与
# 注意: APIサービスがデプロイ済みである必要があります
gcloud run services add-iam-policy-binding web-app-api \
  --member="serviceAccount:web-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=asia-northeast1 \
  --project=$PROJECT_ID
```

### 権限の確認

```bash
# APIサービスのIAMポリシーを確認
gcloud run services get-iam-policy web-app-api \
  --region=asia-northeast1 \
  --project=$PROJECT_ID
```

## 4. Cloud Build サービスアカウントの設定

### 目的
Cloud BuildがCloud Runへのデプロイを実行し、サービスアカウントの設定を行えるようにします。

### 必要な権限の付与

```bash
# Cloud BuildサービスアカウントにCloud Run Admin権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/run.admin"

# Cloud BuildサービスアカウントにService Account User権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### 権限の確認

```bash
# Cloud Buildサービスアカウントの権限を確認
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:*-compute@developer.gserviceaccount.com" \
  --format='table(bindings.role)'
```

期待される出力：
```
ROLE
roles/editor
roles/run.admin
roles/iam.serviceAccountUser
roles/secretmanager.secretAccessor  # 必要に応じて
```

## 5. デプロイ時の使用方法

### APIサービスのデプロイ

```bash
gcloud run deploy api \
  --service-account=api-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --region=asia-northeast1 \
  --source=.
```

### Webサービスのデプロイ

```bash
# APIサービスのURLを取得
API_URL=$(gcloud run services describe web-app-api \
  --region=asia-northeast1 \
  --format='value(status.url)')

# Webサービスをデプロイ（環境変数付き）
gcloud run deploy web \
  --service-account=web-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --update-env-vars="API_URL=$API_URL" \
  --region=asia-northeast1 \
  --source=.
```

## トラブルシューティング

### サービスアカウントが見つからない場合

```bash
# サービスアカウントの完全なリストを確認
gcloud iam service-accounts list --project=$PROJECT_ID
```

### 権限エラーが発生する場合

```bash
# 現在のユーザーの権限を確認
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:user:YOUR-EMAIL" \
  --format="table(bindings.role)"
```

### Cloud Runサービス間の通信が失敗する場合

1. サービスアカウントがCloud Runサービスに正しく設定されているか確認
2. APIサービスのIAMポリシーにweb-saが含まれているか確認
3. 権限付与後、数分待ってから再度デプロイを実行

### Permission 'run.services.setIamPolicy' deniedエラー

Cloud Build サービスアカウントに `roles/run.admin` 権限がない場合に発生します。
セクション4の手順を実行して権限を付与してください。

## 注意事項

- Cloud Build のデフォルトサービスアカウントは `PROJECT_NUMBER-compute@developer.gserviceaccount.com` という形式です
- `PROJECT_ID@cloudbuild.gserviceaccount.com` ではないことに注意してください
- 権限付与後、変更が反映されるまで数分かかる場合があります
- APIサービスへのアクセス権限は、APIサービスがデプロイされた後に設定する必要があります