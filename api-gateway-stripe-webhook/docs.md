# Stripe Webhook 受信用 API Gateway セットアップガイド

## 🎯 概要

既存の Cloud Run サービス（`--no-allow-unauthenticated`）に対して、Stripe からの Webhook を受信できるようにする API Gateway の構築手順です。

**メリット:**
- ✅ Cloud Run のコード変更不要
- ✅ 認証設定はそのまま維持
- ✅ セキュアな外部連携が可能

---

## 📋 必要な作業一覧

| ステップ | 作業内容 | 対象リソース | 所要時間 |
|:---:|:---|:---|:---:|
| 1 | **サービスアカウント作成** | IAM | 1分 |
| 2 | **Cloud Run へのアクセス権限付与** | IAM (サービス単位) | 1分 |
| 3 | **OpenAPI 定義ファイル作成** | YAML ファイル | 5分 |
| 4 | **API Gateway デプロイ** | API Gateway | 5-10分 |

---

## 💡 重要ポイント

> **既存の Cloud Run サービスはそのまま利用可能**
> 
> - 🔧 Cloud Run の再デプロイ不要
> - 📄 OpenAPI ファイルがルーティング設定の役割
> - 🔐 Gateway が自動的に認証トークンを付与

---

## 🚀 セットアップ手順

### ステップ 1: サービスアカウントの作成

API Gateway が Cloud Run を呼び出すための専用サービスアカウントを作成します。

```bash
gcloud iam service-accounts create web-app-stripe-gw-sa \
  --description="Stripe Webhook受信用API Gatewayのサービスアカウント" \
  --display-name="Web App Stripe Gateway サービスアカウント"
```

### ステップ 2: Cloud Run へのアクセス権限付与

作成したサービスアカウントに Cloud Run サービスの呼び出し権限を付与します。

```bash
# 環境変数を設定
export PROJECT_ID="perfect-marketing-tool"
export SERVICE_NAME="web-app-api"
export REGION="asia-northeast1"

# IAM ポリシーバインディングを追加
gcloud run services add-iam-policy-binding ${SERVICE_NAME} \
  --member="serviceAccount:web-app-stripe-gw-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.invoker" \
  --region=${REGION}
```

✅ **確認ポイント**: これで Gateway → Cloud Run の認証が確立されます。

### ステップ 3: OpenAPI 定義ファイルの作成

API Gateway の設定となる OpenAPI 定義を作成します。

```yaml
# openapi2-run.yaml
swagger: "2.0"
info:
  title: stripe-webhook-gateway
  description: API Gateway for Stripe Webhook
  version: 1.0.0

schemes: 
  - "https"
  
produces: 
  - "application/json"

# バックエンド設定
x-google-backend:
  address: https://web-app-api-550308675836.asia-northeast1.run.app        # ← Cloud Run の URL
  jwt_audience: https://web-app-api-550308675836.asia-northeast1.run.app   # ← 必ず同じ値にする

# API エンドポイント定義
paths:
  /api/v1/stripe/webhook:
    post:
      summary: Stripe Webhook エンドポイント
      operationId: stripeWebhook
      consumes:
        - "text/plain"  # Stripe webhookはraw bodyを送信
      responses:
        "200":
          description: Webhook 処理成功
        "400":
          description: 不正なwebhook署名
        "500":
          description: サーバーエラー
```

⚠️ **重要**: `address` と `jwt_audience` は必ず同じ Cloud Run URL を指定してください。

### ステップ 4: API Gateway のデプロイ

以下のコマンドを順番に実行して API Gateway をデプロイします。

```bash
# 1. API リソースの作成
gcloud api-gateway apis create stripe-webhook-api \
  --display-name="Stripe Webhook API"

# 2. API 設定の作成（OpenAPI ファイルをアップロード）
gcloud api-gateway api-configs create stripe-webhook-config-v1 \
  --api=stripe-webhook-api \
  --openapi-spec=openapi2-run.yaml \
  --backend-auth-service-account=web-app-stripe-gw-sa@${PROJECT_ID}.iam.gserviceaccount.com \
  --display-name="Config v1"

# 3. Gateway の作成
gcloud api-gateway gateways create stripe-webhook-gateway \
  --api=stripe-webhook-api \
  --api-config=stripe-webhook-config-v1 \
  --location=${REGION} \
  --display-name="Stripe Webhook Gateway"
```

### ステップ 5: Gateway URL の確認

デプロイ完了後、以下のコマンドで Gateway の URL を確認します。

```bash
gcloud api-gateway gateways describe stripe-webhook-gateway \
  --location=${REGION} \
  --format="value(defaultHostname)"
```

出力例:
```
stripe-webhook-gateway-xxxx.an.gateway.dev
```

最終的な Webhook URL:
```
https://stripe-webhook-gateway-xxxx.an.gateway.dev/api/v1/stripe/webhook
```

🎉 **完了！** この URL を Stripe Dashboard の Webhook 設定に登録してください。

---

## よくある追加設定

| 目的                           | やること                                                                          |
| ---------------------------- | ----------------------------------------------------------------------------- |
| **IP 制限もかけたい**               | Gateway URL に Cloud Armor ポリシーを付与し、Stripe 公開 IP だけ Allow。                     |
| **外部から Cloud Run を完全に遮断したい** | Cloud Run を `--ingress internal-and-cloud-load-balancing` にし、Gateway だけ経路を確保。 |
| **カスタムドメインを使いたい**            | Gateway 側で独自ドメインをマッピング。（Cloud Run はそのままで OK）                                  |

---

### まとめ

* 既存 Cloud Run に **変更なし**、OpenAPI ファイルを書いて Gateway を 1 つ作るだけ。
* 必須作業は **サービスアカウント作成＋`roles/run.invoker` 付与**と **OpenAPI→Gateway デプロイ**の 2 箇所。
* Stripe 署名検証は Cloud Run のハンドラでこれまで通り行えば問題ありません。

これで `--no-allow-unauthenticated` の堅牢さを保ったまま、外部 SaaS（Stripe 等）から安全に Webhook を受け取れます。

[1]: https://cloud.google.com/api-gateway/docs/securing-backend-services?utm_source=chatgpt.com "Securing backend services | API Gateway Documentation"
[2]: https://cloud.google.com/api-gateway/docs/get-started-cloud-run "Getting started with API Gateway and Cloud Run  |  API Gateway Documentation  |  Google Cloud"
