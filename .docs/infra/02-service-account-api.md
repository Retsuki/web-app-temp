# API用サービスアカウントの作成手順

## 前提条件
- Google Cloud SDKがインストール済み
- 適切な権限を持つGoogleアカウントでログイン済み

## 1. Google Cloud プロジェクトの設定

### 現在のプロジェクトを確認

```bash
# 現在設定されているプロジェクトを確認
gcloud config get-value project
```

### 利用可能なプロジェクトの一覧を表示

```bash
# アクセス可能なプロジェクトの一覧を表示
gcloud projects list
```

### プロジェクトを変更

```bash
# プロジェクトIDを指定して変更
gcloud config set project YOUR-PROJECT-ID

# 変更後のプロジェクトを確認
gcloud config get-value project
```

## 2. API用サービスアカウントの作成

### プロジェクトIDを環境変数に設定

```bash
# 現在のプロジェクトIDを確認
gcloud config get-value project

# プロジェクトIDを環境変数に設定
export PROJECT_ID=your-project-id
```

### サービスアカウントを作成

```bash
# api-sa という名前でサービスアカウントを作成
gcloud iam service-accounts create api-sa \
  --display-name="API Service Account" \
  --description="Service account for API Cloud Run service" \
  --project=$PROJECT_ID
```

### 作成されたサービスアカウントを確認

```bash
# サービスアカウントが作成されたか確認
gcloud iam service-accounts list --project=$PROJECT_ID | grep api-sa

# 詳細情報を確認
gcloud iam service-accounts describe api-sa@$PROJECT_ID.iam.gserviceaccount.com
```

## 3. 必要な権限の付与

### Secret Manager アクセス権限を付与

```bash
# Secret Managerから環境変数を読み取る権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:api-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### 権限が付与されたか確認

```bash
# api-saに付与された権限を確認
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:serviceAccount:api-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --format="table(bindings.role)"
```

成功すると以下のような出力が表示されます：

```
ROLE
roles/secretmanager.secretAccessor
```

## 4. Cloud Run でのサービスアカウント使用

Cloud Run サービスのデプロイ時に、作成したサービスアカウントを指定します：

```bash
gcloud run deploy api \
  --service-account=api-sa@$PROJECT_ID.iam.gserviceaccount.com \
  --region=YOUR-REGION \
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

必要に応じて、プロジェクトのIAM管理者に権限の付与を依頼してください。