# セットアップ手順 (対話式)

## 1. セットアップ概要

- コマンド: `npm run setup`
- 目的: プロジェクト名、Supabase のローカルポート群、環境変数（.env）を対話式に設定します。
- 処理内容:
  - `package.json:name` と `supabase/config.toml:project_id` を更新
  - `supabase/config.toml` のポート群を、入力した基点ポートをもとに一括更新
  - `./.env`, `api/.env`, `web/.env` を `.env` が無ければ `.env.example` から生成し、必要な値を更新
  - 最後に Supabase の再起動を実行するか確認（Y/Enter で自動再起動）

## 2. 実行例

```bash
$ npm run setup

> web_app_temp@1.0.0 setup
> node scripts/setup.mjs

プロジェクト名を入力してください [web_app_temp]
> my-cool-project

Supabase の基点ポートを入力してください [57430]
> 58430

GOOGLE_CLOUD_PROJECT_ID を入力してください [your-existing-project]
> my-gcp-project

GOOGLE_CLIENT_ID を入力してください [1234567890-abcdef.apps.googleusercontent.com]
> 1234567890-abcdef.apps.googleusercontent.com

GOOGLE_CLIENT_SECRET を入力してください [****既存****]
> ********************************

設定を適用します (base=58430)...
Supabase の設定を更新しました:
- project_id:  my-cool-project (旧: web_app_temp)
- shadow_port: 58430
- api:         58431
- db:          58432
- studio:      58433
- inbucket:    58434
- analytics:   58437
- realtime:    58438
- pooler:      58439

.env を更新しました:
- ./.env を更新
- api/.env を更新
- web/.env を更新

Supabase を再起動しますか？ [Y/n]
> y

Supabase を再起動しています...
... (npm run supabase:stop のログ)
... (npm run supabase:start のログ)

セットアップ完了。
```

## 3. 入力と更新先

- プロジェクト名
  - 反映先: `package.json:name`、`supabase/config.toml:project_id`
  - 付随更新: `package.json:scripts.supabase:stop` の `--project-id` を新しい名称に更新

- Supabase の基点ポート（例: 57430）
  - 反映先: `supabase/config.toml`
    - `[db] shadow_port = base`
    - `[api] port = base + 1`
    - `[db] port = base + 2`
    - `[studio] port = base + 3`
    - `[inbucket] port = base + 4`
    - `[analytics] port = base + 7`
    - `[realtime] port = base + 8`
    - `[db.pooler] port = base + 9`
  - 連動更新（.env のポート書き換え）:
    - `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_URL`/`GOOGLE_REDIRECT_URI` → API ポート（base + 1）
    - `DATABASE_URL` → DB ポート（base + 2）
  - 対象ファイル: `./.env`, `api/.env`, `web/.env`（無い場合は各 `.env.example` から生成）

- Google 環境変数（`GOOGLE_CLOUD_PROJECT_ID`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`）
  - 反映先: `./.env`, `api/.env`, `web/.env`（既存キーは上書き、無い場合は追加）
  - 既存値検出: `.env`→`.env.example` の順で既存値を見つけ、未入力時はデフォルトとして維持

