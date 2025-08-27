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
gcloud run deploy web-app-web \
  --source=. \
  --region=asia-northeast1 \
  --allow-unauthenticated \
  --service-account=web-sa@PROJECT_ID.iam.gserviceaccount.com \
  --memory=512Mi --max-instances=2
```

### 3.3 Cloud Run (API / Hono) デプロイ

```bash
# API は認証必須
gcloud run deploy web-app-api \
  --source=./api \
  --region=asia-northeast1 \
  --no-allow-unauthenticated \
  --service-account=api-sa@PROJECT_ID.iam.gserviceaccount.com \
  --ingress=all
```

> **ポイント**: 
> - `--no-allow-unauthenticated` により IAM トークン必須
> - `--ingress=all` に設定（`internal-and-cloud-load-balancing`だと外部からアクセスできないため）

### 3.4 サービスアカウント & IAM

#### サービスアカウントの作成

```bash
# API用サービスアカウント
gcloud iam service-accounts create api-sa \
  --display-name="API Service Account" \
  --project=$PROJECT_ID

# Web用サービスアカウント  
gcloud iam service-accounts create web-sa \
  --display-name="Web Frontend Service Account" \
  --project=$PROJECT_ID
```

#### 権限の付与

```bash
# 1. Cloud BuildがCloud Runにデプロイする権限
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_ID@cloudbuild.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_ID@cloudbuild.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"

# 2. API用サービスアカウントにSecret Manager読み取り権限
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:api-sa@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# 3. Web → API 呼び出し権限
gcloud run services add-iam-policy-binding web-app-api \
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
| Cloud Run が 403    | IAM 認証失敗                 | `gcloud run services get-iam-policy web-app-api` を確認 |
| ブラウザで API CORS エラー | 直叩きしている                  | Next.js server 経由で呼び出す                       |
| Cloudflare 502     | Origin health check fail | Cloud Run URL をブラウザで直接確認                     |
| API が 404         | ingress 設定が internal     | `--ingress=all` に変更する                         |

---

## 9. よくある質問 (FAQ)

### Q1: なぜ API の `--ingress` を `all` に設定する必要があるのですか？

**A**: Cloud Run 間の通信でも、以下の理由により `--ingress all` が必要になることがあります：

1. **IDトークンの検証**: Google IDトークンを使った認証では、トークンの発行者と検証者が異なるサービスになります
2. **外部エンドポイント経由の通信**: Cloud Run サービス間でも、パブリックURLを使った通信の場合は外部経路とみなされます
3. **開発・デバッグの容易性**: 問題が発生した際に、直接APIにアクセスして確認できます

セキュリティは `--no-allow-unauthenticated` 設定により、IAM認証で保護されているため問題ありません。

### Q2: なぜ API を `--no-allow-unauthenticated` にする必要があるのですか？

**A**: セキュリティを強化するためです：

1. **公開アクセスの禁止** - インターネットから直接 API にアクセスできなくなります
2. **IAM 認証の必須化** - 認証されたサービスアカウントからのみアクセス可能
3. **CORS 設定が不要** - ブラウザから直接アクセスしないため
4. **DDoS 攻撃のリスク軽減** - 直接アクセスが不可能なため

### Q3: フロントエンドから API を呼び出すにはどうすればいいですか？

**A**: Next.js のサーバーサイド（SSR/Route Handler）から ID トークンを使って呼び出します：

```typescript
// ブラウザから直接呼び出すのは NG
// Next.js のサーバーサイドで実行する
const idToken = await fetch(
  `http://metadata/computeMetadata/v1/instance/service-accounts/default/identity?audience=${API_URL}`,
  { headers: { 'Metadata-Flavor': 'Google' } }
).then(r => r.text());

const response = await fetch(`${API_URL}/api/v1/users`, {
  headers: { Authorization: `Bearer ${idToken}` }
});
```

### Q4: この構成でコストはどのくらい増えますか？

**A**: `--ingress` 設定を変更してもコストは増えません：

- Cloud Run の料金体系は変わりません
- IAM 認証も追加料金なし

### Q5: サービスアカウントはなぜ必要ですか？

**A**: サービスアカウントは、アプリケーションが Google Cloud リソースにアクセスする際の身分証明書として機能します：

1. **最小権限の原則** - 各サービスに必要最小限の権限のみを付与
2. **セキュリティの分離** - サービスごとに異なる権限を設定
3. **監査性の向上** - どのサービスが何にアクセスしたかを追跡可能
4. **デフォルトサービスアカウントの危険性回避** - Editor権限を持つデフォルトアカウントは使用しない

### Q6: 各サービスアカウントにはどのような権限が必要ですか？

**A**: 以下の権限構成が必要です：

| サービスアカウント | 必要な権限 | 理由 |
|---|---|---|
| **api-sa** | `roles/secretmanager.secretAccessor` | Secret Manager から環境変数を読み取るため |
| **web-sa** | APIサービスへの `roles/run.invoker` | APIを呼び出すため（APIサービスレベルで設定） |
| **Cloud Build** | `roles/run.admin`<br>`roles/iam.serviceAccountUser` | Cloud Run へのデプロイと<br>サービスアカウントの使用権限 |

権限の流れ：
```
ユーザー → Web (web-sa) → [IDトークン] → API (api-sa) → Secret Manager
```

---

## 10. 参考リンク

* Cloud Run IAM Auth: [https://cloud.google.com/run/docs/authenticating](https://cloud.google.com/run/docs/authenticating)
* Cloud Run Ingress 設定: [https://cloud.google.com/run/docs/securing/ingress](https://cloud.google.com/run/docs/securing/ingress)
* Cloudflare Free プラン機能表: [https://developers.cloudflare.com](https://developers.cloudflare.com)
* Supabase Pricing: [https://supabase.com/pricing](https://supabase.com/pricing)

---

*最終更新: 2025-08-02*