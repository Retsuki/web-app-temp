# secai

## 作成日時
2025-07-31 11:29

# コンセプト
とりあえず、セキュリティチェックしておこうかー。

## 概要
システム開発するときは、まずはセキュAIを使うよねって世界観。
安いし、何回も再審査できる。セキュリティ会社への依頼は、セキュAIに認められた後。

## ターゲット
主に個人・少人数でサービスを作っている人たち。スタートアップなど

## 機能
- 外部アタックチェック
- Github連携＋コードチェック
- 再審査
- 課金

## サービスの流れ
1. 脆弱性チェックしよう（URL入力）
2. メール認証で登録
3. 30分以内にメールに結果が届く
4. 詳細に審査する
5. 課金する
6. Github連携してコードチェックする
7. 結果を出す
8. 問題を修正すれば、再審査する

## 金額
月額4980円

## 画面
- LP(/)
  - URL入力欄 + 審査ボタン -> /signup?audit-url=https://ime-3.com に遷移
- サインアップ画面(/signup)
  - メール認証
  - google認証
  - 審査依頼のURLクエリが付いている場合は、審査依頼を開始する
    - アカウント登録完了＆審査依頼完了画面(/signup/complete)
      - 30分以内にメールに結果が届きます
      - プロジェクト一覧へボタン(プロジェクト名はURLにしておく)
- ログイン画面(/login)
  - メール認証
  - google認証
- プロジェクト一覧画面(/projects)
  - プロジェクト新規作成ボタン
  - プロジェクト一覧
    - プロジェクト名
    - 最終審査結果
    - 最後の審査依頼日時
- ダッシュボード(projects/:projectId)
    - 審査依頼ボタン
    - 審査テーブル
      - カラム
        - URL
        - 状態・結果
        - 審査依頼日時
        - 再審査ボタン
      - 行
        - 1審査1行
- 審査依頼画面(/projects/:projectId/audit)
    - 外部テスト or コードチェック
      - 外部テスト
        - URL入力
      - コードチェック
        - Github連携
        - コードチェック
- 設定画面(/settings)
    - メール
    - 現在のプラン
    - 有効期限
    - 有料プランへの移行
- プラン一覧(/settings/plans)
    - 現在のプラン
    - 有効期限
    - 有料プラン

## 技術スタック
- TypeScript
- Next.js(Frontend)
- shadcn/ui
- Tailwind CSS
- orval
- tanstack/react-query
- zod
- Hono.js(Backend)
- Supabase(Auth)
- Supabase(DB)
- Drizzle(ORM)
- Cloud Build
- Cloud Run
- Cloud Tasks
- GitHub
- Stripe
- Biome


