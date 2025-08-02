# Cloud Build 設定ガイド

## Cloud Build サービスアカウントの権限設定

Cloud Build でアプリケーションをデプロイする際、サービスアカウントに適切な権限を付与する必要があります。

### 必要な権限

1. **Cloud Run Admin** - Cloud Run サービスをデプロイし、IAMポリシーを設定するため
2. **Service Account User** - 他のサービスアカウントとして動作するため

### 設定コマンド

```bash
# プロジェクトIDを設定
PROJECT_ID=ime3-website  # あなたのプロジェクトIDに置き換えてください

# Cloud BuildサービスアカウントにCloud Run Admin権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/run.admin"

# Cloud BuildサービスアカウントにService Account User権限を付与
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

### プロジェクト番号の確認方法

```bash
# プロジェクト番号を確認
gcloud projects describe $PROJECT_ID --format="value(projectNumber)"
```

### エラー例と対処法

#### エラー: Permission 'run.services.setIamPolicy' denied

```
{
  "status": {
    "code": 7,
    "message": "Permission 'run.services.setIamPolicy' denied on resource 'projects/ime3-website/locations/asia-northeast1/services/web-app-web' (or resource may not exist)."
  }
}
```

このエラーは、Cloud Build サービスアカウントに `roles/run.admin` 権限がない場合に発生します。
上記のコマンドを実行して権限を付与してください。

### 注意事項

- Cloud Build のデフォルトサービスアカウントは `PROJECT_NUMBER-compute@developer.gserviceaccount.com` という形式です
- `PROJECT_ID@cloudbuild.gserviceaccount.com` ではないことに注意してください
- 権限付与後、数分待ってから再度デプロイを実行してください

### 権限確認コマンド

```bash
# 現在の権限を確認
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:*-compute@developer.gserviceaccount.com" \
  --format='table(bindings.role)'
```

成功すると以下のような出力が表示されます：
```
ROLE
roles/editor
roles/run.admin
roles/iam.serviceAccountUser
roles/secretmanager.secretAccessor
```