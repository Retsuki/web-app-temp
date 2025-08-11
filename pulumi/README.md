# Web App Template - Infrastructure as Code (Pulumi)

このディレクトリには、Web App TemplateプロジェクトのGCPインフラストラクチャをPulumiで管理するコードが含まれています。

## 📋 概要

PulumiによるIaCで以下のGCPリソースを自動管理します：

- **サービスアカウント**: api-sa, web-sa, stripe-gw-sa
- **Secret Manager**: 環境変数の安全な管理
- **Artifact Registry**: Dockerイメージレジストリ
- **Cloud Run**: APIとWebサービス
- **API Gateway**: Stripe Webhook受信用
- **Cloud Build**: CI/CDトリガー
- **GCP APIs**: 必要なAPIの有効化

## 🚀 クイックスタート

### 前提条件

1. **Pulumi CLIのインストール**
```bash
curl -fsSL https://get.pulumi.com | sh
```

2. **Google Cloud SDKのインストール**
```bash
# macOS
brew install google-cloud-sdk

# その他のOS
# https://cloud.google.com/sdk/docs/install
```

3. **GCP認証**
```bash
gcloud auth login
gcloud auth application-default login
```

### セットアップ

1. **依存関係のインストール**
```bash
cd pulumi
npm install
```

2. **Pulumiバックエンドの設定**
```bash
# ローカルファイルシステムを使用（開発用）
pulumi login --local

# または Pulumi Cloud を使用（推奨）
pulumi login
```

3. **スタックの作成**
```bash
# 開発環境
pulumi stack init dev

# 本番環境
pulumi stack init prod
```

4. **設定値の設定**
```bash
# 環境の設定（dev または prod）
pulumi config set environment dev

# GCPプロジェクトの設定
pulumi config set gcp:project YOUR_PROJECT_ID
pulumi config set gcp:region asia-northeast1

# GitHubリポジトリの設定（Cloud Build用）
pulumi config set github:owner YOUR_GITHUB_USERNAME
pulumi config set github:repo web-app-temp
```

5. **環境変数ファイルの準備**
```bash
# APIの環境変数
cp ../api/.env.example ../api/.env.dev
cp ../api/.env.example ../api/.env.prod

# Webの環境変数
cp ../web/.env.example ../web/.env.dev
cp ../web/.env.example ../web/.env.prod

# 各ファイルに実際の値を設定
```

## 📦 デプロイ

### 開発環境へのデプロイ
```bash
# スタック選択
pulumi stack select dev

# プレビュー（変更内容確認）
pulumi preview

# デプロイ実行
pulumi up
```

### 本番環境へのデプロイ
```bash
# スタック選択
pulumi stack select prod

# プレビュー
pulumi preview

# デプロイ実行
pulumi up
```

## 🔧 管理コマンド

### リソースの確認
```bash
# 現在のスタックのリソース一覧
pulumi stack

# 出力値の確認
pulumi stack output

# 詳細な状態確認
pulumi stack export | jq
```

### リソースの更新
```bash
# 設定変更
pulumi config set KEY VALUE

# 更新の適用
pulumi up
```

### リソースの削除
```bash
# リソースを削除（注意！）
pulumi destroy

# スタックの削除
pulumi stack rm STACK_NAME
```

## 📁 ディレクトリ構造

```
pulumi/
├── index.ts                    # メインエントリポイント
├── package.json               # 依存関係
├── tsconfig.json              # TypeScript設定
├── Pulumi.yaml                # Pulumiプロジェクト設定
├── Pulumi.dev.yaml            # 開発環境設定（自動生成）
├── Pulumi.prod.yaml           # 本番環境設定（自動生成）
└── src/
    ├── config/                # 設定管理
    │   └── index.ts
    ├── resources/             # リソース定義
    │   ├── project.ts         # GCP API有効化
    │   ├── service-accounts.ts # サービスアカウント
    │   ├── secrets.ts         # Secret Manager
    │   ├── artifact-registry.ts # Dockerレジストリ
    │   ├── cloud-run.ts       # Cloud Runサービス
    │   ├── api-gateway.ts     # API Gateway
    │   └── cloud-build.ts     # Cloud Buildトリガー
    └── utils/
        └── env-loader.ts      # 環境変数ローダー
```

## 🔐 環境変数の管理

環境変数は以下の流れで管理されます：

1. **ローカルファイル** (`api/.env.dev`, `web/.env.dev` など)
2. **Pulumiが読み込み** (env-loader.ts)
3. **Secret Managerへアップロード** (secrets.ts)
4. **Cloud Runでマウント** (cloud-run.ts)

### 環境変数の更新

```bash
# 1. ローカルファイルを編集
vim ../api/.env.prod

# 2. Pulumiで更新を適用
pulumi up

# 3. Cloud Runサービスを再デプロイ（必要に応じて）
gcloud run deploy ...
```

## 🚨 トラブルシューティング

### よくある問題

#### 1. API有効化エラー
```bash
# 手動でAPIを有効化
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

#### 2. 権限エラー
```bash
# 現在のユーザーに必要な権限を付与
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member="user:YOUR_EMAIL" \
  --role="roles/owner"
```

#### 3. 環境変数ファイルが見つからない
```bash
# ファイルが存在することを確認
ls -la ../api/.env.dev
ls -la ../web/.env.dev
```

## 📝 注意事項

1. **環境変数ファイル**はGitにコミットしないでください
2. **Pulumi.*.yaml**ファイルもGitにコミットしないでください（暗号化された設定を含む）
3. **本番環境へのデプロイ**は慎重に行ってください
4. **Cloud Build**トリガーを使用する場合は、事前にGitHub連携が必要です

## 🔗 関連ドキュメント

- [Pulumi Documentation](https://www.pulumi.com/docs/)
- [Pulumi GCP Provider](https://www.pulumi.com/registry/packages/gcp/)
- [Google Cloud Run](https://cloud.google.com/run/docs)
- [Google Secret Manager](https://cloud.google.com/secret-manager/docs)