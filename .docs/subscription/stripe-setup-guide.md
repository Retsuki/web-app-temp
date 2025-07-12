# Stripeセットアップガイド

このガイドでは、Stripeアカウントの作成から本アプリケーションとの連携設定までの手順を説明します。

## 1. Stripeアカウント作成

### 1.1 アカウント登録

1. [Stripe](https://stripe.com) にアクセス
2. 「今すぐ始める」または「Sign up」をクリック
3. 以下の情報を入力：
   - メールアドレス
   - 氏名
   - パスワード
   - 国（日本）

4. メール認証を完了

### 1.2 ビジネス情報の設定

初回ログイン後、以下の情報を入力：

- **ビジネスタイプ**: 個人事業主 or 法人
- **業種**: ソフトウェア・SaaS
- **ウェブサイトURL**: アプリケーションのURL
- **ビジネスの説明**: サービス内容を簡潔に記載

## 2. 開発環境の準備

### 2.1 テストモードの確認

1. ダッシュボード右上の「テスト環境」スイッチがONになっていることを確認
2. テストモードでは実際の決済は発生しません

### 2.2 APIキーの取得

1. **ダッシュボード** → **開発者** → **APIキー** に移動
2. 以下のキーをコピー：

```bash
# .envファイルに設定
STRIPE_SECRET_KEY=sk_test_51O...（シークレットキー）
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51O...（公開可能キー）
```

⚠️ **重要**: 
- `sk_test_`で始まるキーは**秘密鍵**です。GitHubなどに公開しないでください
- `pk_test_`で始まるキーは**公開鍵**です。フロントエンドで使用可能です

## 3. 商品と料金の設定

### 3.1 商品の作成

1. **ダッシュボード** → **商品** → **商品を追加** をクリック

2. **Indieプラン**を作成：
   ```
   商品名: Indie Plan
   説明: 個人開発者向けプラン
   ```

3. **Proプラン**を作成：
   ```
   商品名: Pro Plan
   説明: チーム・企業向けプラン
   ```

### 3.2 料金の設定

各商品に対して料金を追加：

#### Indieプラン
1. 商品詳細ページで「料金を追加」をクリック
2. 月額料金を設定：
   ```
   料金モデル: 定期的
   金額: ¥1,000
   請求期間: 月次
   料金ID: → 自動生成されたIDをコピー
   ```
3. 年額料金を設定：
   ```
   料金モデル: 定期的
   金額: ¥10,000
   請求期間: 年次
   料金ID: → 自動生成されたIDをコピー
   ```

#### Proプラン
同様に以下を設定：
- 月額: ¥3,000
- 年額: ¥30,000

### 3.3 環境変数の更新

取得した料金IDを`.env`ファイルに設定：

```bash
# Stripe Price IDs
STRIPE_PRICE_ID_INDIE_MONTHLY=price_1O3abc...
STRIPE_PRICE_ID_INDIE_YEARLY=price_1O3def...
STRIPE_PRICE_ID_PRO_MONTHLY=price_1O3ghi...
STRIPE_PRICE_ID_PRO_YEARLY=price_1O3jkl...
```

## 4. Webhookの設定

### 4.1 Webhookエンドポイントの追加

1. **ダッシュボード** → **開発者** → **Webhook** に移動
2. 「エンドポイントを追加」をクリック
3. 以下を設定：

```
エンドポイントURL: https://yourdomain.com/api/v1/stripe/webhook
※ ローカル開発時はStripe CLIを使用（後述）
```

4. 「リッスンするイベント」で以下を選択：
   - `customer.subscription.created` - サブスクリプション作成時
   - `customer.subscription.updated` - サブスクリプション更新時
   - `customer.subscription.deleted` - サブスクリプション削除時
   - `invoice.payment_succeeded` - 支払い成功時
   - `invoice.payment_failed` - 支払い失敗時

5. 「エンドポイントを追加」をクリック

### 4.2 Webhook署名シークレットの取得

1. 作成したエンドポイントの詳細画面を開く
2. 「署名シークレット」セクションの「表示」をクリック
3. 表示されたシークレットをコピー：

```bash
# .envファイルに設定
STRIPE_WEBHOOK_SECRET=whsec_abc123...
```

## 5. ローカル開発環境でのテスト

### 5.1 Stripe CLIのインストール

#### macOS
```bash
brew install stripe/stripe-cli/stripe
```

#### Windows
```powershell
# PowerShellで実行
iwr https://github.com/stripe/stripe-cli/releases/latest/download/stripe_windows_x86_64.zip -OutFile stripe_windows_x86_64.zip
Expand-Archive stripe_windows_x86_64.zip
```

#### Linux
```bash
# Debian/Ubuntu
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update
sudo apt install stripe
```

### 5.2 Stripe CLIでのログイン

```bash
stripe login
# ブラウザが開くので、Stripeアカウントでログイン
```

### 5.3 Webhookの転送設定

```bash
# ローカルのエンドポイントにWebhookを転送
stripe listen --forward-to localhost:8080/api/v1/stripe/webhook

# 表示されるWebhook signing secretを.envに設定
# Ready! Your webhook signing secret is whsec_xxx (^C to quit)
```

### 5.4 テスト実行

別のターミナルで以下を実行してイベントをトリガー：

```bash
# サブスクリプション作成イベントをトリガー
stripe trigger customer.subscription.created

# 支払い成功イベントをトリガー
stripe trigger invoice.payment_succeeded
```

## 6. テスト用カード番号

開発時は以下のテストカード番号を使用：

### 成功するカード
```
番号: 4242 4242 4242 4242
有効期限: 任意の将来の日付
CVC: 任意の3桁
```

### 失敗するカード
```
# 残高不足
番号: 4000 0000 0000 9995

# カード拒否
番号: 4000 0000 0000 0002

# 有効期限切れ
番号: 4000 0000 0000 0069
```

### 3Dセキュア認証が必要なカード
```
番号: 4000 0025 0000 3155
```

## 7. カスタマーポータルの設定

### 7.1 カスタマーポータルの有効化

1. **ダッシュボード** → **設定** → **請求** → **カスタマーポータル** に移動
2. 以下を設定：

#### 機能
- ✅ サブスクリプションのキャンセル
- ✅ サブスクリプションの一時停止
- ✅ プランの変更
- ✅ 支払い方法の更新
- ✅ 請求履歴の表示

#### ビジネス情報
- ヘッドライン: 「サブスクリプション管理」
- プライバシーポリシーURL: `https://yourdomain.com/privacy`
- 利用規約URL: `https://yourdomain.com/terms`

### 7.2 プラン変更ルール

1. 「商品と料金」セクションで：
   - アップグレード: **即時で比例配分**
   - ダウングレード: **期間終了時**

## 8. 本番環境への移行

### 8.1 本番環境の有効化

1. ビジネス情報の入力を完了
2. 銀行口座情報を登録（日本の場合）
3. 本人確認書類をアップロード

### 8.2 本番APIキーへの切り替え

1. ダッシュボードで「本番環境」に切り替え
2. 本番用のAPIキーを取得：
   ```bash
   STRIPE_SECRET_KEY=sk_live_xxx
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   ```

### 8.3 本番Webhookの設定

1. 本番環境で新しいWebhookエンドポイントを作成
2. 本番用のWebhook署名シークレットを取得

## 9. よくある質問

### Q: テスト環境と本番環境のデータは共有される？
A: いいえ、完全に分離されています。テスト環境のデータは本番環境には反映されません。

### Q: 日本でStripeを使う際の注意点は？
A: 
- 消費税の自動計算設定が可能
- 日本円での決済に対応
- 日本の銀行口座への入金対応

### Q: サブスクリプションの無料トライアルは設定できる？
A: はい、商品の料金設定時に無料トライアル期間を設定できます。

### Q: 返金処理はどうすれば良い？
A: Stripeダッシュボードから直接返金可能です。APIでの自動返金も実装できます。

## 10. トラブルシューティング

### Webhook署名検証エラー
```
Error: No signatures found matching the expected signature for payload
```
→ 環境変数の`STRIPE_WEBHOOK_SECRET`が正しいか確認

### APIキーエラー
```
Error: Invalid API Key provided
```
→ テスト環境と本番環境のキーを混同していないか確認

### CORS エラー
→ Stripe Checkoutを使用する場合は発生しません（リダイレクト方式のため）

## 11. 参考リンク

- [Stripe公式ドキュメント（日本語）](https://stripe.com/docs/ja)
- [Stripe API リファレンス](https://stripe.com/docs/api)
- [Stripe Checkout ガイド](https://stripe.com/docs/payments/checkout)
- [Webhook イベントタイプ一覧](https://stripe.com/docs/api/events/types)
- [テストカード一覧](https://stripe.com/docs/testing)