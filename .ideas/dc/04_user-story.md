# dc プラットフォーム ユーザーマニュアル

## 概要
dc は「Create Your Dashboard in 5 MINUTES」をコンセプトに、アプリのユーザー動線を可視化するダッシュボードを素早く構築できるプラットフォームです。
このマニュアルでは、ログイン・プロジェクト作成後の実際の操作フロー（定義生成→SDK導入→ダッシュボード活用）を説明します。

---

## 前提条件
- ユーザーがログイン済み
- 少なくとも1つのプロジェクトが作成済み
- プロジェクトダッシュボードにアクセス可能な状態

---

## 用語
- イベント定義: 収集するイベントの定義（`dc_event_definitions`）
- コホート定義: ユーザー群を定義する条件（`dc_cohort_definitions`）
- ダッシュボード/ウィジェット: 可視化の構成（`dc_dashboards`/`dc_dashboard_widgets`）
- SDK/受信API: フロント導入用SDKと `ingest-api`（`POST /v1/events` など）
- 集計テーブル: 日次集計 `dc_agg_events_daily`（MVPで導入）

---

分担ポリシー（更新）

- App担当: 実装ロジックとデータ面を主担当（UI/CRUD/AI生成/ダッシュボード/集計ロジック）
- SDK担当: SDKと受信APIの実装＋インフラ設定（デプロイ/スケジューラ/ネットワーク/Secrets/CORS/レート制限）

- App担当
    - UC1: プロジェクト作成（一覧/新規）
    - UC2: AI定義生成（/projects/{id}/generate）
    - UC3/UC4: イベント/コホート定義の確認・保存
    - UC8: ダッシュボード可視化（クエリ・ウィジェット）
    - UC9: 定義CRUD（dc_event_definitions /dc_cohort_definitions）
    - UC11: 定期集計の実装ロジック
    - 集計SQL/増分Upsert/水位管理コード
    - 集計用APIエンドポイント（idempotent）
- SDK担当
    - UC5: SDK導入（docsスニペ/公開鍵）
    - UC6: identify（匿名→会員紐付け）
    - UC7: track（イベント送信・プロパティ規約）
    - UC10: 許可ドメイン/鍵ローテーションUIのSDK側ドキュメントとingest側検証
    - UC11: Cloud Scheduler → app-apiの集計エンドポイントを叩く
    - ingest-api: 受信（POST /v1/events）実装、バリデーション、許可ドメイン・鍵検証、CORS/レート制限
    - インフラ設定一式
    - スケジューラ（例: Cloud Scheduler → app-apiの集計エンドポイントを叩く）
    - デプロイ（Cloud Run/CI/CD）、API Gateway、Secrets、ネットワーク（CORS/許可ドメイン）
    - 監視/ログ/アラート（集計ジョブの失敗検知含む）

---

## ユースケース1: プロジェクトを作成する（必要に応じて）

### シナリオ
初回利用時に新しいプロジェクトを作成したい。

### 操作フロー
1. プロジェクト一覧にアクセス
   - `/ja/projects` にアクセス
2. 新規作成
   - 「新規プロジェクト」ボタン、または `/ja/projects/new` のウィザードへ
   - プロジェクト名、（任意）説明を入力し「作成」

---

## ユースケース2: LP/概要から定義を自動生成する（AI）

### シナリオ
LPのURLまたはプロダクト概要を入力し、イベント/コホート定義の下書きを自動生成したい。

### 操作フロー
1. プロジェクト詳細にアクセス
   - `/ja/projects/{projectId}` にアクセス
2. 生成ページへ移動
   - サブナビから「Generate (AI)」をクリック → `/ja/projects/{projectId}/generate`
3. 入力して生成
   - 「Landing Page URL」または「Product Overview」を入力し「Generate」をクリック
4. 初回結果の保存
   - 生成結果を一括保存 or 個別選択して保存

---

## ユースケース3: 生成されたイベント定義を確認・保存する

### シナリオ
AIが提案したイベント定義を精査し、ダッシュボードに使える形で保存したい。

### 操作フロー
1. イベント定義ページへ
   - `/ja/projects/{projectId}/events` にアクセス
2. 定義の確認
   - `event_key`, `name`, `properties_schema` を確認
3. 保存/編集
   - そのまま保存、または編集して保存（`dc_event_definitions` に反映）

---

## ユースケース4: 生成されたコホート定義を確認・保存する

### シナリオ
AIが提案したコホート定義を精査し、分析軸として保存したい。

### 操作フロー
1. コホート定義ページへ
   - `/ja/projects/{projectId}/cohorts` にアクセス
2. 定義の確認
   - `criteria`（DSL/プリセット）を確認
3. 保存/編集
   - そのまま保存、または編集して保存（`dc_cohort_definitions` に反映）

---

## ユースケース5: SDKを導入してイベントを送信する

### シナリオ
アプリにSDKを導入し、ユーザー識別とイベント送信を開始したい。

### 操作フロー
1. プロジェクトのドキュメントページへ
   - `/ja/projects/{projectId}/docs` にアクセス
   - SDK初期化スニペットと公開鍵（`ingest_public_key`）を確認
2. 設定でドメイン/鍵を確認
   - `/ja/projects/{projectId}/settings` で `allowed_domains` と鍵を確認/更新
3. SDKを実装
   ```javascript
   import { init, identify, track } from '@acme/dc-sdk'

   init({ baseUrl: 'https://ingest.example.com', publicKey: 'pk_...' })
   identify({ externalId: 'user_123' })
   track('page_view', { path: '/home' })
   ```
   - 送信先は `sdk-ingest` リポの受信API（例: `POST /v1/events`）

---

## ユースケース6: ユーザー識別と匿名→会員の紐付け

### シナリオ
匿名訪問者の行動履歴を、ログイン後の会員IDに紐付けたい。

### 操作フロー
1. 匿名アクセス
   - SDK初期化時に匿名ID（クッキー）でイベント送信 → `dc_end_users.anonymous_id` に格納
2. ログイン/識別
   - `identify({ externalId: 'user_123' })` を呼び出し、以降のイベントを `external_id` に紐付け
3. マージ
   - サーバー側で匿名→会員の紐付けルールに従い、履歴を同一ユーザーとして集約

---

## ユースケース7: カスタムイベント送信とプロパティ設計

### シナリオ
標準の `page_view` 以外に、プロダクト特有のイベントを送信したい。

### 操作フロー
1. イベント定義の用意
   - `/ja/projects/{projectId}/events` で `event_key` と `properties_schema` を定義
2. SDKから送信
   ```javascript
   track('purchase_completed', { orderId: 'o_1', amount: 1200, currency: 'JPY' })
   ```
3. 後方互換
   - プロパティの追加は可能、削除/型変更は非推奨（互換ポリシーを定義）

---

## ユースケース8: ダッシュボードで可視化する

### シナリオ
イベント送信後、主要KPI（ファネル/フロー/リテンションなど）をダッシュボードで確認したい。

### 操作フロー
1. ダッシュボードへアクセス
   - `/ja/projects/{projectId}/dashboard` にアクセス
2. 期間・ウィジェットを設定
   - 期間: 過去7日/30日/カスタム
   - ウィジェット: Funnel/Flow/Retention/Heatmap/Custom/World Map を追加・編集
3. 集計の仕組み
   - トレンド系は `dc_agg_events_daily` を参照（高速表示）
   - 詳細/ドリルダウンは `dc_events`/`dc_sessions` をオンデマンド集計

---

## ユースケース9: イベント/コホート定義を作成・編集（CRUD）

### シナリオ
自動生成後に定義を追記・修正し、可視化の精度を上げたい。

### 操作フロー
1. 定義ページへ移動
   - 各定義ページにアクセス
     - イベント定義: `/ja/projects/{projectId}/events`
     - コホート定義: `/ja/projects/{projectId}/cohorts`
2. イベント定義を作成/更新/削除
   - `event_key`, `name`, `properties_schema` を入力して保存
   - 保存先: `dc_event_definitions`（一意: `(project_id, event_key)`）
3. コホート定義を作成/更新/削除
   - `criteria`（DSL/プリセット）を設定して保存
   - 保存先: `dc_cohort_definitions`

---

## ユースケース10: ドメイン許可と鍵のローテーション

### シナリオ
受信APIの安全性を高めるため、許可ドメインを管理し公開鍵を更新したい。

### 操作フロー
1. 設定へアクセス
   - `/ja/projects/{projectId}/settings` にアクセス
2. 許可ドメインの更新
   - `allowed_domains` を追記・保存（CORS/許可判定に利用）
3. 鍵のローテーション
   - 「Regenerate Keys」を実行 → SDK側で `publicKey` を更新

---

## ユースケース11: イベントの定期集計を実行する

### シナリオ
ダッシュボードのトレンド表示を高速化するため、`dc_events` を日次集計し `dc_agg_events_daily` を更新したい。

### 操作フロー
1. 集計ジョブを設定
   - インフラでスケジュールを設定（例: Cloud Scheduler で 5–15分間隔）
   - 実行先: app/api の集計用エンドポイント（`features/analytics/jobs/aggregate-events-daily`）
2. ウィンドウを決定
   - ジョブは水位（from_ts/to_ts）を決定（例: 最終処理時刻→現在時刻-数分）
3. 集計とUpsert
   - `dc_events` を `(project_id, day(UTC), event_key)` で集計
   - `dc_event_definitions` を左結合して `event_definition_id` を解決
   - 結果を `dc_agg_events_daily` に Upsert（件数/一意ユーザー）
4. 水位の更新
   - 成功後に水位を更新（ジョブ状態をアプリ側で保持）
5. 監視と再実行
   - ログ/メトリクスで失敗を検知し再実行（同ウィンドウで冪等Upsert）

補足
- ダッシュボードのトレンド系ウィジェットは `dc_agg_events_daily` を参照、詳細は生集計を併用
- 集計遅延（例: 2–5分）を設け、遅延到着イベントの取りこぼしを軽減

## ベストプラクティス
- `event_key` は後方互換を意識して命名（リネーム時はエイリアス/マージ方針）
- 重要ウィジェットはダッシュボードに固定し、期間は共通コントロールで切替
- SDKの `identify` はログイン/識別タイミングで呼ぶ（匿名→会員の紐付け）
- 集計は `dc_agg_events_daily` と生集計を併用し、応答速度と鮮度を両立

---

## 参考
- SDK実装ガイド: `/ja/docs/sdk`
- 受信API（ingest-api）: `POST /v1/events`
- OpenAPI（app/api）: `/ja/docs/api`
