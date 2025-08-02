# 案1 + Cloudflare Free 導入ガイド

> **目的**: 個人開発規模で「安価」「簡単」「最低限のセキュリティ」を両立するために、Google Cloud Run (private) と Supabase、そして Cloudflare Free プランを組み合わせる構成を短時間で構築できるようにする。

---

## 1. 構成図

```
┌───────────────┐  DNS / TLS / DDoS / WAF (Free)
│   Cloudflare   │  example.com / api.example.com
└───────┬────────┘
        │ HTTPS
┌───────▼────────┐        ┌──────────────────────────┐
│  Cloud Run      │  IAM   │  Cloud Run (API / Hono)  │
│  (Next.js 15)   │◀───────│  --no-allow-unauth       │
│  public URL     │ ID tok │  api-<env>-<project>     │
└───────┬─────────┘        └──────────┬───────────────┘
        │ SSR / Route Handler                  │
        │ fetch + ID token                     │
        ▼                                      ▼
┌───────────────────┐                   ┌────────────────┐
│  Supabase (Auth)  │                   │    Stripe      │
│  PostgreSQL DB    │                   └────────────────┘
└───────────────────┘
```

---

## 2. 前提条件

| 項目               | 必須バージョン         | 備考                 |
| ---------------- | --------------- | ------------------ |
| GCP プロジェクト       | ―               | 課金有効化済み            |
| gcloud CLI       | 474.0 以上        | `gcloud --version` |
| Node.js          | 20.x            | Next.js, Hono で検証  |
| Supabase アカウント   | Free/Pro どちらでも可 | リージョンは *同じ大陸内* 推奨  |
| Cloudflare アカウント | Free            | DNS 管理権限必須         |

---

## 3. ステップバイステップ

### 3.1 Supabase プロジェクト準備

1. **プロジェクト作成**: `Region: ap-northeast-1` など Cloud Run 近傍リージョンを選択。
2. **テーブル / Auth セットアップ**: テンプレート SQL or Drizzle Migrations を実行。
3. **サービスロールキー**は *絶対にコードに埋め込まない*。必要に応じ Secret Manager へ保存。

### 3.2 Cloud Run (Next.js) デプロイ

```bash
# コンテナビルド & デプロイ
gcloud run deploy web-frontend \
  --source=. \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --service-account=web-sa@PROJECT_ID.iam.gserviceaccount.com \
  --memory=512Mi --max-instances=2
```

### 3.3 Cloud Run (API / Hono) デプロイ

```bash
# API は非公開
gcloud run deploy api \
  --source=./api \
  --region=asia-northeast1 \
  --no-allow-unauthenticated \
  --service-account=api-sa@PROJECT_ID.iam.gserviceaccount.com \
  --ingress=internal-and-cloud-load-balancing
```

> **ポイント**: `--no-allow-unauthenticated` により IAM トークン必須。

### 3.4 サービスアカウント & IAM

```bash
# Web → API 呼び出し権限
gcloud run services add-iam-policy-binding api \
  --member="serviceAccount:web-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/run.invoker"
```

### 3.5 Next.js 側で ID トークンを付与

```ts
import { getToken } from 'next-auth/jwt';

export async function callApi(path: string, init: RequestInit = {}) {
  const audience = process.env.API_URL; // Cloud Run の URL
  const idToken = await fetch(
    `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${audience}`,
    { headers: { 'Metadata-Flavor': 'Google' } }
  ).then((r) => r.text());

  return fetch(`${audience}${path}`, {
    ...init,
    headers: { ...(init.headers || {}), Authorization: `Bearer ${idToken}` },
  });
}
```

*SSR / Route Handler 内で実行し、ブラウザから API を直叩きしないこと*

### 3.6 Cloudflare 設定

1. **DNS**: `A` または `CNAME` で Cloud Run ドメインを登録。 (`proxy` オレンジ雲 = ON)
2. **SSL/TLS**: `Full` モード、有効期限90日の Edge 証明書が自動発行。
3. **WAF & Rate Limiting** (Free):

   * *Security → WAF → DDoS* → 「High」
   * *Rules → Rate Limiting Rules* → `api.example.com/*` へ `100 req / 1min per IP`
4. **Page Rules**: `cache bypass` や `Cache TTL` の調整は任意。

---

## 4. シークレット管理

| シークレット              | 保存先            | 参照方法                        |
| ------------------- | -------------- | --------------------------- |
| SUPABASE_URL       | Secret Manager | Cloud Run → `--set-secrets` |
| SUPABASE_ANON_KEY | Secret Manager | 同上                          |
| STRIPE_SECRET_KEY | Secret Manager | 同上                          |

---

## 5. モニタリング & アラート

1. **Cloud Logging**: 構造化ログ (`severity`, `trace`) を出力。例: `logger.info({ userId, route }, 'request')`
2. **Error Reporting**: `severity=ERROR` 以上を自動集計。
3. **Alert Policies**: 5xx レート > 5% (1分) でメール通知。
4. **Supabase**: *Project → Logs* で Auth 失敗を監視。

---

## 6. コスト目安 (月額)

| サービス       | 無料枠内                 | 想定超過後              |
| ---------- | -------------------- | ------------------ |
| Cloud Run  | ~2M req, 360k GiB-s | 約 $0.000024 / req |
| Supabase   | Free 500MB DB        | Pro $25           |
| Cloudflare | Free                 | Pro $20 (必要に応じ)   |
| **合計**     | $0〜25               | $20〜45            |

---

## 7. 今後のスケールアップ指針

1. **アクセス急増**: Cloudflare Pro → Bot Fight / キャッシュ TTL 最適化。
2. **BtoB API 提供**: API Gateway を挿入し API キー + Quota 管理。
3. **データベース負荷**: read-heavy なら Supabase Read Replica、write-heavy なら Cloud SQL に移行。

---

## 8. トラブルシューティング Quick Tips

| 症状                 | 原因候補                     | 対策                                           |
| ------------------ | ------------------------ | -------------------------------------------- |
| Cloud Run が 403    | IAM 認証失敗                 | `gcloud run services get-iam-policy api` を確認 |
| ブラウザで API CORS エラー | 直叩きしている                  | Next.js server 経由で呼び出す                       |
| Cloudflare 502     | Origin health check fail | Cloud Run URL をブラウザで直接確認                     |

---

## 9. 参考リンク

* Cloud Run IAM Auth: [https://cloud.google.com/run/docs/authenticating](https://cloud.google.com/run/docs/authenticating)
* Cloudflare Free プラン機能表: [https://developers.cloudflare.com](https://developers.cloudflare.com)
* Supabase Pricing: [https://supabase.com/pricing](https://supabase.com/pricing)

---

*最終更新: 2025-08-02*