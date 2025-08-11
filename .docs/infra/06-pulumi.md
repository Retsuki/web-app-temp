# Pulumi組み込み手順（ローカルAI実装用・コピペ可）

> 目的：既存テンプレ（`/web`=公開、`/api`=IAM保護、Stripe Webhook=API Gateway）に **Pulumi(TypeScript)** を“後付け”。
> CIは **Cloud Buildのまま**。PulumiもCloud Buildで回す。

---

## 0. 事前情報（置換用）

* `PROJECT_ID`：あなたのGCPプロジェクトID
* `REGION`：`asia-northeast1` を推奨
* `APP_NAME`：`web-app`（既存名に合わせる）

---

## 1. 追加ディレクトリとファイル

```
infra/
  pulumi/
    package.json
    tsconfig.json
    Pulumi.yaml
    index.ts              # Run(Web/API) + SA + Secrets + Artifact Registry
    apigw.ts              # Stripe Webhook API Gateway
    stacks/
      Pulumi.dev.yaml
      Pulumi.stg.yaml
      Pulumi.prd.yaml
cloudbuild.infra.yaml     # PulumiをCloud Buildで実行
```

### `infra/pulumi/package.json`

```json
{
  "name": "infra",
  "private": true,
  "type": "module",
  "scripts": {
    "up": "pulumi up --yes",
    "preview": "pulumi preview",
    "destroy": "pulumi destroy --yes"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.0.0",
    "@pulumi/gcp": "^7.0.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0"
  }
}
```

### `infra/pulumi/tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "Bundler",
    "strict": true
  }
}
```

### `infra/pulumi/Pulumi.yaml`

```yaml
name: web-app-template
runtime: nodejs
description: GCP infra for web/api + Stripe webhook
```

---

## 2. Pulumi本体：Run/SA/Secret/AR（`infra/pulumi/index.ts`）

```ts
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const cfg = new pulumi.Config();
const project = cfg.require("project");
const region  = cfg.get("region") ?? "asia-northeast1";
const appName = "web-app"; // 既存のサービス名に合わせる

// 必要API
[
  "run.googleapis.com",
  "artifactregistry.googleapis.com",
  "secretmanager.googleapis.com",
  "iam.googleapis.com",
  "iamcredentials.googleapis.com",
  "logging.googleapis.com",
  "monitoring.googleapis.com",
  "apigateway.googleapis.com"
].forEach((s, i) => {
  new gcp.projects.Service(`svc-${i}`, { project, service: s, disableOnDestroy: false });
});

// Artifact Registry: apps(Docker)
new gcp.artifactregistry.Repository("apps", {
  project, location: region, repositoryId: "apps", format: "DOCKER",
  dockerConfig: { immutableTags: true }
});

// Service Accounts
const webSa = new gcp.serviceaccount.Account("web-sa", { accountId: "web-sa" });
const apiSa = new gcp.serviceaccount.Account("api-sa", { accountId: "api-sa" });
const gwSa  = new gcp.serviceaccount.Account("web-app-stripe-gw-sa", { accountId: "web-app-stripe-gw-sa" });

// Secret（例：Stripe）
const stripe = new gcp.secretmanager.Secret("STRIPE_SECRET_KEY", { replication: { automatic: true } });
new gcp.secretmanager.SecretVersion("STRIPE_SECRET_KEY_v1", {
  secret: stripe.id,
  secretData: pulumi.secret(cfg.require("stripeSecret")),
});
new gcp.secretmanager.SecretIamMember("stripe-read-api", {
  secretId: stripe.id, role: "roles/secretmanager.secretAccessor",
  member: apiSa.email.apply(e => `serviceAccount:${e}`)
});

// Cloud Run v2: API（IAM必須・外部公開URLはあるが認証が必要）
const api = new gcp.cloudrunv2.Service(`${appName}-api`, {
  location: region,
  ingress: "INGRESS_TRAFFIC_ALL",
  template: {
    serviceAccount: apiSa.email,
    containers: [{
      image: pulumi.interpolate`${region}-docker.pkg.dev/${project}/apps/api:initial`,
      envs: [{
        name: "STRIPE_SECRET_KEY",
        valueSource: { secretKeyRef: { secret: stripe.name, version: "latest" } }
      }],
      resources: { limits: { cpu: "1", memory: "512Mi" } }
    }],
    scaling: { minInstanceCount: 0, maxInstanceCount: 10 }
  }
});

// Cloud Run v2: Web（公開）
const web = new gcp.cloudrunv2.Service(`${appName}-web`, {
  location: region,
  ingress: "INGRESS_TRAFFIC_ALL",
  template: {
    serviceAccount: webSa.email,
    containers: [{
      image: pulumi.interpolate`${region}-docker.pkg.dev/${project}/apps/web:initial`,
      envs: [
        { name: "NEXT_PUBLIC_ENV", value: "dev" },
        // サーバー側プロキシで使うAudience（=APIのURL）
        { name: "API_AUDIENCE", value: pulumi.interpolate`${api.uri}` }
      ]
    }]
  }
});

// APIのinvokerをWeb/ApiGatewayにだけ付与
new gcp.cloudrunv2.ServiceIamMember("api-invoker-web", {
  project, location: region, service: api.name,
  role: "roles/run.invoker",
  member: webSa.email.apply(e => `serviceAccount:${e}`)
});
new gcp.cloudrunv2.ServiceIamMember("api-invoker-gw", {
  project, location: region, service: api.name,
  role: "roles/run.invoker",
  member: gwSa.email.apply(e => `serviceAccount:${e}`)
});

export const webUrl = web.uri;
export const apiUrl = api.uri;
```

---

## 3. Pulumi：API Gateway（Stripe Webhook）（`infra/pulumi/apigw.ts`）

```ts
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";

const cfg = new pulumi.Config();
const project = cfg.require("project");
const region  = cfg.get("region") ?? "asia-northeast1";

const api = new gcp.apigateway.Api("stripe-webhook-api", { apiId: "stripe-webhook-api" });

const providerSa = pulumi.interpolate`web-app-stripe-gw-sa@${project}.iam.gserviceaccount.com`;
const config = new gcp.apigateway.ApiConfig("stripe-webhook-config", {
  api: api.name,
  apiConfigId: "v1",
  openapiDocuments: [{
    document: { path: "../../api-gateway-stripe-webhook/openapi2-run.yaml" }
  }],
  project,
  gatewayConfig: { backendConfig: { googleServiceAccount: providerSa } }
});

const gw = new gcp.apigateway.Gateway("stripe-webhook", {
  apiConfig: config.id,
  gatewayId: "stripe-webhook",
  region
});

export const stripeWebhookUrl = gw.defaultHostname.apply(h => `https://${h}`);
```

> 既存 `api-gateway-stripe-webhook/openapi2-run.yaml` の `x-google-backend` が **`web-app-api`** を指すことを確認。

---

## 4. Pulumiスタック設定（例：`infra/pulumi/stacks/Pulumi.dev.yaml`）

```yaml
config:
  web-app-template:project: PROJECT_ID
  web-app-template:region: asia-northeast1
  web-app-template:stripeSecret:
    secure: sk_test_xxxxxxxxxxxxxxxxx
```

※ stg/prd も同様に作成。各キーは Pulumi の secure config に保存。

---

## 5. Cloud BuildでPulumiを回す（`cloudbuild.infra.yaml`）

```yaml
options:
  logging: CLOUD_LOGGING_ONLY
  substitutionOption: ALLOW_LOOSE

substitutions:
  _STACK: dev
  _REGION: asia-northeast1

availableSecrets:
  secretManager:
    - versionName: projects/$PROJECT_ID/secrets/PULUMI_ACCESS_TOKEN/versions/latest
      env: "PULUMI_ACCESS_TOKEN"
    - versionName: projects/$PROJECT_ID/secrets/STRIPE_SECRET_KEY/versions/latest
      env: "STRIPE_SECRET"

steps:
  - name: gcr.io/cloud-builders/npm
    dir: infra/pulumi
    args: ["ci"]

  - name: "pulumi/pulumi-nodejs"
    dir: infra/pulumi
    entrypoint: bash
    env:
      - "PULUMI_ACCESS_TOKEN=${PULUMI_ACCESS_TOKEN}"
    args:
      - -lc
      - |
        pulumi stack select ${_STACK} || pulumi stack init ${_STACK}
        pulumi config set project $PROJECT_ID
        pulumi config set region ${_REGION}
        pulumi config set --secret stripeSecret ${STRIPE_SECRET}
        pulumi up --yes
```

**必要権限（Pulumi実行用のCloud Build実行SA）**
付与ロール例：

* `roles/run.admin`
* `roles/iam.serviceAccountUser`
* `roles/secretmanager.secretAccessor`
* `roles/artifactregistry.admin`
* `roles/apigateway.admin`

**トリガー例（dev）**

* Build config: `cloudbuild.infra.yaml`
* Substitutions: `_STACK=dev`
* Included files: `infra/pulumi/**`

---

## 6. Web→API呼び出しを「サーバー側プロキシ」に統一

### 追加：`/web/src/lib/server-api.ts`

```ts
import { GoogleAuth } from "google-auth-library";

export async function callApi(path: string, init?: RequestInit) {
  const target = process.env.API_AUDIENCE!; // PulumiがWebに注入
  const auth = new GoogleAuth();
  const client = await auth.getIdTokenClient(target);
  const url = `${target}${path}`;
  const res = await client.request({
    url,
    method: init?.method ?? "GET",
    headers: init?.headers as any,
    data: init?.body as any
  });
  return res.data;
}
```

### 例：Next Route（`/web/src/app/api/health/route.ts`）

```ts
import { NextResponse } from "next/server";
import { callApi } from "@/src/lib/server-api";

export async function GET() {
  const data = await callApi("/api/v1/health");
  return NextResponse.json(data);
}
```

> クライアントからは **自前のNext API** を叩く。ブラウザ→Next(SSR)→Hono(API)。
> これで **CORS不要**、**APIはIAM保護のまま**。

---

## 7. 既存Cloud Build（web/api）はそのまま使う

* 画像のpush先を **AR: `asia-northeast1-docker.pkg.dev/$PROJECT_ID/apps/{web|api}:$COMMIT_SHA`** に統一。
* `gcloud run deploy` は既存の `web-app-web` / `web-app-api` を**上書き**。
* **注意**：`--update-env-vars` で Pulumi注入の環境変数を消さないよう、基本は **env更新なし**運用。

---

## 8. シークレット登録（初回のみ）

```bash
# Pulumi Cloud Token
echo -n "pulumi-access-token" | gcloud secrets create PULUMI_ACCESS_TOKEN --data-file=-

# Stripe Secret（Pulumiが読み込む）
echo -n "sk_test_xxx" | gcloud secrets create STRIPE_SECRET_KEY --data-file=-
```

---

## 9. 動作確認フロー

1. Cloud Buildで `cloudbuild.infra.yaml` を手動実行（dev）。
2. 出力の `webUrl` にアクセスしてWeb起動を確認。
3. `/app/api/health` を叩いて **200**（Next経由でAPI到達）を確認。
4. `stripeWebhookUrl` をStripeに登録→テスト送信→APIが受信できることを確認。

---

## 10. 失敗時の切り戻し

* Pulumiの差分を戻す：`pulumi destroy --yes`（スタック単位）
* アプリは直前のイメージに再デプロイ：`gcloud run deploy ... --image=<前のタグ>`

---

