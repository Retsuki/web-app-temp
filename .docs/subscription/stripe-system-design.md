# Stripe決済システム設計書

## 1. 概要

本設計書は、Web App TemplateにStripe決済機能を実装するための技術仕様を定義します。サブスクリプション型のSaaSモデルを採用し、Free/Indie/Proの3つのプランを提供します。

## 2. システムアーキテクチャ

### 2.1 全体構成

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   API       │────▶│   Stripe    │
│  (Next.js)  │     │  (Hono)     │     │    API      │
└─────────────┘     └─────────────┘     └─────────────┘
                            │                    │
                            ▼                    │
                    ┌─────────────┐              │
                    │  Database   │◀─────────────┘
                    │ (PostgreSQL)│    Webhook
                    └─────────────┘
```

### 2.2 コンポーネント構成

#### Frontend層
- **料金ページ** (`/[lang]/pricing`)
- **請求管理ページ** (`/[lang]/dashboard/billing`)
- **支払い成功/失敗ページ** (`/[lang]/billing/success`, `/[lang]/billing/error`)
- **決済UIコンポーネント**
  - PricingCard
  - SubscriptionStatus
  - PaymentHistory
  - PlanUpgradeModal

#### API層
- **認証付きエンドポイント**
  - `GET /api/v1/billing/subscription` - 現在のサブスクリプション取得
  - `GET /api/v1/billing/history` - 支払い履歴取得
  - `POST /api/v1/billing/checkout` - Checkout Session作成
  - `PATCH /api/v1/billing/subscription` - プラン変更
  - `DELETE /api/v1/billing/subscription` - サブスクリプション解約
  - `POST /api/v1/billing/portal` - カスタマーポータルURL生成

- **Webhookエンドポイント**
  - `POST /api/v1/stripe/webhook` - Stripeイベント受信

#### データベース層
既存のスキーマを活用：
- `profiles` - ユーザープロファイル（Stripe顧客ID、プラン情報）
- `subscriptions` - アクティブなサブスクリプション
- `payment_history` - 支払い履歴
- `webhook_events` - Webhookイベントログ
- `plan_limits` - プラン別の機能制限

## 3. 技術スタック

### 3.1 必要なパッケージ

#### Frontend
```json
{
  "dependencies": {
    "@stripe/stripe-js": "^4.x",
    "@stripe/react-stripe-js": "^2.x"
  }
}
```

#### Backend
```json
{
  "dependencies": {
    "stripe": "^17.x"
  }
}
```

### 3.2 環境変数

```bash
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxx          # バックエンド用
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx  # フロントエンド用
STRIPE_WEBHOOK_SECRET=whsec_xxx        # Webhook署名検証用

# Stripe Price IDs
STRIPE_PRICE_ID_INDIE_MONTHLY=price_xxx
STRIPE_PRICE_ID_INDIE_YEARLY=price_xxx
STRIPE_PRICE_ID_PRO_MONTHLY=price_xxx
STRIPE_PRICE_ID_PRO_YEARLY=price_xxx

# URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 4. 実装詳細

### 4.1 初期設定

#### Stripeダッシュボードでの設定
1. **製品とPrice作成**
   ```
   - Indie Monthly: ¥1,000/月
   - Indie Yearly: ¥10,000/年 (16%割引)
   - Pro Monthly: ¥3,000/月
   - Pro Yearly: ¥30,000/年 (16%割引)
   ```

2. **Webhook設定**
   - エンドポイント: `https://yourdomain.com/api/v1/stripe/webhook`
   - 監視イベント:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
     - `customer.updated`

3. **カスタマーポータル設定**
   - プラン変更: 有効（アップグレードは即時、ダウングレードは期間終了時）
   - 解約: 有効（期間終了時）
   - 請求履歴: 有効

### 4.2 APIクライアント初期化

#### Backend (`api/src/lib/stripe.ts`)
```typescript
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})
```

#### Frontend (`web/src/lib/stripe/client.ts`)
```typescript
import { loadStripe } from '@stripe/stripe-js'

export const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
)
```

### 4.3 プラン管理

#### プラン定義 (`shared/constants/plans.ts`)
```typescript
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      projectLimit: 1,
      apiCallsPerMonth: 1000,
      teamMembers: 1,
    },
  },
  indie: {
    id: 'indie',
    name: 'Indie',
    monthlyPrice: 1000,
    yearlyPrice: 10000,
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ID_INDIE_MONTHLY,
      yearly: process.env.STRIPE_PRICE_ID_INDIE_YEARLY,
    },
    features: {
      projectLimit: 5,
      apiCallsPerMonth: 10000,
      teamMembers: 3,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 3000,
    yearlyPrice: 30000,
    stripePriceIds: {
      monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY,
      yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY,
    },
    features: {
      projectLimit: -1, // 無制限
      apiCallsPerMonth: 100000,
      teamMembers: 10,
    },
  },
} as const
```

### 4.4 Checkout Session作成

```typescript
// POST /api/v1/billing/checkout
export const createCheckoutSession = async ({
  userId,
  priceId,
  billingCycle,
}: CreateCheckoutDto) => {
  const user = await getUserById(userId)
  
  // 既存顧客 or 新規顧客
  const customerId = user.stripeCustomerId || 
    (await createStripeCustomer(user)).id

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/{locale}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/{locale}/pricing`,
    metadata: {
      userId,
    },
  })

  return { checkoutUrl: session.url }
}
```

### 4.5 Webhook処理

```typescript
// POST /api/v1/stripe/webhook
export const handleStripeWebhook = async (req: Request) => {
  const sig = req.headers.get('stripe-signature')!
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 })
  }

  // 重複処理防止
  const existingEvent = await getWebhookEvent(event.id)
  if (existingEvent) {
    return new Response('Event already processed', { status: 200 })
  }

  // イベント記録
  await recordWebhookEvent(event)

  // イベントタイプ別処理
  switch (event.type) {
    case 'customer.subscription.created':
      await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.updated':
      await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
      break
    case 'customer.subscription.deleted':
      await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
      break
    case 'invoice.payment_succeeded':
      await handlePaymentSucceeded(event.data.object as Stripe.Invoice)
      break
    case 'invoice.payment_failed':
      await handlePaymentFailed(event.data.object as Stripe.Invoice)
      break
  }

  return new Response('Webhook processed', { status: 200 })
}
```

### 4.6 使用量制限の実装

```typescript
// 使用量チェックミドルウェア
export const checkUsageLimit = async (
  userId: string,
  feature: string
) => {
  const user = await getUserWithPlan(userId)
  const limit = await getPlanLimit(user.plan, feature)
  
  if (limit === -1) return true // 無制限
  
  const currentUsage = await getCurrentUsage(userId, feature)
  return currentUsage < limit
}

// 使用量更新
export const incrementUsage = async (
  userId: string,
  feature: string,
  amount = 1
) => {
  await db
    .update(profiles)
    .set({
      monthlyUsageCount: sql`${profiles.monthlyUsageCount} + ${amount}`,
    })
    .where(eq(profiles.userId, userId))
}
```

## 5. フロントエンド実装

### 5.1 料金ページコンポーネント

```typescript
// app/[lang]/pricing/page.tsx
export default async function PricingPage({ params }: Props) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  
  return (
    <div className="pricing-container">
      <h1>{dict.pricing.title}</h1>
      <div className="plans-grid">
        {Object.values(PLANS).map((plan) => (
          <PricingCard
            key={plan.id}
            plan={plan}
            dict={dict}
          />
        ))}
      </div>
    </div>
  )
}
```

### 5.2 決済フロー

```typescript
// components/app/billing/checkout-button.tsx
export function CheckoutButton({ priceId, planName }: Props) {
  const [loading, setLoading] = useState(false)
  
  const handleCheckout = async () => {
    setLoading(true)
    
    const { checkoutUrl } = await apiClient.POST('/api/v1/billing/checkout', {
      body: { priceId },
    })
    
    if (checkoutUrl) {
      window.location.href = checkoutUrl
    }
  }
  
  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Loading...' : `Subscribe to ${planName}`}
    </button>
  )
}
```

## 6. セキュリティ考慮事項

### 6.1 認証・認可
- すべての請求関連APIは認証必須
- ユーザーは自分のサブスクリプションのみ操作可能
- Stripe顧客IDの所有権を常に検証

### 6.2 Webhook検証
- 署名検証を必須とする
- リプレイ攻撃防止（タイムスタンプチェック）
- イベントIDによる重複処理防止

### 6.3 データ保護
- カード情報は一切保存しない（Stripeに委託）
- 個人情報の最小限保存
- HTTPS通信の強制

## 7. エラーハンドリング

### 7.1 決済エラー
- カード拒否 → ユーザーにわかりやすいメッセージ
- 残高不足 → 別の支払い方法を提案
- 期限切れ → カード更新を促す

### 7.2 システムエラー
- Stripe API障害 → リトライ機構
- DB接続エラー → トランザクション管理
- Webhook失敗 → Stripeの自動リトライを活用

## 8. モニタリング

### 8.1 ビジネスメトリクス
- MRR（月間経常収益）
- チャーン率
- LTV（顧客生涯価値）
- 支払い成功率

### 8.2 システムメトリクス
- Webhook処理成功率
- API応答時間
- エラー率

## 9. テスト戦略

### 9.1 開発環境
- Stripe Test Mode使用
- テスト用カード番号での動作確認
- Stripe CLIでのWebhookテスト

### 9.2 テストケース
- 新規サブスクリプション作成
- プランアップグレード/ダウングレード
- 支払い失敗とリトライ
- 解約フロー
- Webhook処理の冪等性

## 10. 実装スケジュール

### Phase 1: 基盤構築（1週間）
- [ ] Stripe SDKセットアップ
- [ ] 環境変数設定
- [ ] 基本的なAPI実装
- [ ] Webhook受信基盤

### Phase 2: コア機能（2週間）
- [ ] Checkout Session作成
- [ ] サブスクリプション管理
- [ ] Webhook処理実装
- [ ] 使用量制限機能

### Phase 3: UI実装（1週間）
- [ ] 料金ページ
- [ ] 請求管理画面
- [ ] 支払い履歴表示
- [ ] プラン変更モーダル

### Phase 4: テスト・改善（1週間）
- [ ] 統合テスト
- [ ] エラーハンドリング改善
- [ ] パフォーマンス最適化
- [ ] ドキュメント整備