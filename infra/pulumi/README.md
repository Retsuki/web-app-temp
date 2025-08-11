# Pulumi インフラストラクチャ管理

## 概要
個人開発プロジェクト用のPulumiによるGCPインフラ管理。初期は本番環境のみで運用し、サービスが成長した際に開発環境を追加する設計。

## 現在の構成（本番環境のみ）

### スタック構成
- **prod**: 本番環境（初期はこれのみ使用）

### リソース構成
- Cloud Run (Web): 公開アクセス可能
- Cloud Run (API): IAM認証必須  
- API Gateway: Stripe Webhook受信用
- Service Accounts: 各サービス用
- Secret Manager: 機密情報管理
- Artifact Registry: Dockerイメージ保存

## セットアップ手順

### 1. 必要なシークレットの作成
```bash
# Pulumi Cloudのアクセストークン（Cloud Build用）
echo -n "your-pulumi-token" | gcloud secrets create PULUMI_ACCESS_TOKEN --data-file=-
```

### 2. スタック設定の作成（重要：GitHubにはアップロードしない）
```bash
# テンプレートをコピー
cp infra/pulumi/stacks/Pulumi.prod.example.yaml infra/pulumi/stacks/Pulumi.prod.yaml

# 実際の値を設定（このファイルは.gitignoreされています）
vi infra/pulumi/stacks/Pulumi.prod.yaml
```

以下を実際の値に置き換え：

- `PROJECT_ID`: 実際のGCPプロジェクトID
- `databaseUrl`: Supabaseデータベース接続文字列
- `supabaseServiceRoleKey`: SupabaseのService Roleキー
- `supabaseJwtSecret`: SupabaseのJWTシークレット（最低32文字）
- `stripeSecretKey`: Stripeの本番用秘密鍵（sk_live_xxx）
- `stripeWebhookSecret`: Stripe Webhookのシークレット（whsec_xxx）
- `stripePriceIdIndieMonthly`: Indieプラン月額のPrice ID
- `stripePriceIdIndieYearly`: Indieプラン年額のPrice ID
- `stripePriceIdProMonthly`: Proプラン月額のPrice ID
- `stripePriceIdProYearly`: Proプラン年額のPrice ID

### 3. デプロイ実行
```bash
# Cloud Build経由でデプロイ
gcloud builds submit --config=cloudbuild.infra.yaml
```

## 将来の拡張（ユーザー1000人超えた時）

### 開発環境の追加手順

1. **新しいスタックファイルを作成**
```bash
cp infra/pulumi/stacks/Pulumi.prod.yaml infra/pulumi/stacks/Pulumi.dev.yaml
```

2. **開発環境用の設定に更新**
```yaml
# Pulumi.dev.yaml
config:
  web-app-template:project: PROJECT_ID-dev  # 開発用プロジェクトを使う場合
  web-app-template:region: asia-northeast1
  web-app-template:stripeSecret:
    secure: sk_test_xxxxxxxxxxxxxxxxx  # テスト用キー
```

3. **Cloud Buildトリガーを環境別に設定**
```bash
# 本番用トリガー
gcloud builds triggers create github \
  --repo-name=your-repo \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.infra.yaml \
  --substitutions=_STACK=prod

# 開発用トリガー（developブランチ用）
gcloud builds triggers create github \
  --repo-name=your-repo \
  --branch-pattern="^develop$" \
  --build-config=cloudbuild.infra.yaml \
  --substitutions=_STACK=dev
```

4. **index.tsで環境別の設定を追加**
```typescript
// 環境に応じた設定
const isProd = cfg.get("stack") === "prod";
const envValue = isProd ? "production" : "development";
const minInstances = isProd ? 1 : 0;  // 本番は最小1インスタンス
```

## コスト最適化のポイント

### 個人開発初期（〜1000ユーザー）
- 最小インスタンス数: 0（コールドスタート許容）
- メモリ: 512Mi（最小構成）
- CPU: 1

### サービス成長後（1000ユーザー〜）
- 本番: 最小インスタンス数を1に（レスポンス改善）
- 開発環境を別プロジェクトで分離
- モニタリング強化

## トラブルシューティング

### Pulumiスタックの初期化エラー
```bash
# ローカルで手動初期化
cd infra/pulumi
pulumi stack init prod
pulumi config set project YOUR_PROJECT_ID
```

### シークレットアクセスエラー
```bash
# Cloud Buildサービスアカウントに権限付与
gcloud projects add-iam-policy-binding PROJECT_ID \
  --member="serviceAccount:PROJECT_NUMBER@cloudbuild.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

## 環境変数の管理

### Pulumiによる一元管理
- WebとAPIの全環境変数を`Pulumi.prod.yaml`で管理
- Secret Manager（`web-env-production`、`api-env-production`）は不要
- 環境変数の変更時はPulumiを再実行するだけでCloud Runが更新される

### 既存のCI/CDとの関係
- **Pulumiデプロイ**: インフラと環境変数を管理
- **Cloud Build（web/api）**: Dockerイメージのビルドとプッシュのみ
- 環境変数はPulumiが設定するため、Cloud Buildでの環境変数設定は不要

### セキュリティ（重要）
- **`Pulumi.prod.yaml`は絶対にGitHubにアップロードしない**（.gitignoreに追加済み）
- `Pulumi.prod.example.yaml`（テンプレート）のみGitHubにアップロード
- 機密情報は`secure:`プレフィックスで暗号化
- Pulumiの状態ファイルも暗号化されて保存
- Cloud Build実行時も環境変数は保護される

### GitHubでの管理
```
GitHubにアップロード:
├── Pulumi.prod.example.yaml  ✅ テンプレート（実際の値なし）
└── README.md                  ✅ ドキュメント

GitHubにアップロードしない:
└── Pulumi.prod.yaml          ❌ 実際の秘密情報（.gitignore済み）
```

## 注意事項
- 初期は本番環境のみで運用し、必要に応じて開発環境を追加
- Stripeは本番環境でもテストモードから開始可能
- Cloud Runの無料枠を最大限活用する設計
- 環境変数の更新はPulumi経由で行う（手動でSecret Managerを触らない）