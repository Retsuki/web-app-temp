# リポジトリ ガイドライン

## プロジェクト構成とモジュールの整理

- ルートのスクリプトがワークスペースを統括します: `api/`（Hono + TypeScript）、`web/`（Next.js 15）、`pulumi/`（IaC）、`supabase/`（ローカル開発）、`.docs/` と `.vscode/`（ドキュメント/エディタ）。
- Web アプリ: `web/src/app`（ルート/レイアウト）、`web/src/components`（UI/アプリ）、`web/src/lib`（ユーティリティ）。
- API サービス: `api/src` 直下に機能別フォルダ（例: `features/*`）、共通ファクトリは `api/src/_shared` 配下。
- Swagger UI: API 起動時は `http://localhost:8080/api/v1/ui` で確認可能。

## ビルド・テスト・開発コマンド

- ルート開発（API + Web）: `npm run dev`
- Lint/フォーマット: `npm run lint`, `npm run format`
- 型チェック（全体）: `npm run typecheck`
- Web: `npm --prefix web run dev|build|start`
- API: `npm --prefix api run dev|build|start`
- DB（Drizzle）: `npm run db:generate|db:push|db:migrate|db:seed`（`api/` へのプロキシ）
- Supabase（ローカル）: `npm run supabase:start|stop|db:reset`
- Pulumi（インフラ）: `npm run pulumi:preview:dev|prod`, `npm run pulumi:dev|prod`

## コーディング規約と命名規則

- フォーマッタ/リンタ: Biome。コミット前に必ず `npm run format` を実行。プレコミットフックは `web` と `api` の型チェックを実行。
- TypeScript/ESM。`api/` では TS のインポートで拡張子 `.js` を明示（Node ESM のため）。
- インデントは 2 スペース。行幅は Biome のデフォルトに準拠。
- 命名: ファイル/フォルダは kebab-case（例: `profile-edit.tsx`）、React コンポーネントは PascalCase、変数は camelCase、定数は UPPER_SNAKE_CASE。

## テスト方針

- ユニット/E2E テストランナーは未設定。追加する場合:
  - Web: React Testing Library + Vitest。E2E は Playwright。
  - API: Vitest または Node のテストランナー。機能ルートを分離してテスト。
- テストはソースと同じ場所（`*.test.ts[x]`）に配置し、クリティカルパスの網羅を目指す。

## コミット/プルリクエスト方針

- Conventional Commits を推奨: `feat:`, `fix:`, `chore:`, `refactor:`, `docs:`。
- PR には以下を必ず含める: 目的/要約、関連 Issue のリンク、UI 変更のスクリーンショット、DB/インフラのマイグレーション注意点、ローカル実行手順。

## セキュリティ/設定の注意

- 秘密情報はコミットしない。ローカルでは `.env` ファイル（`web/.env.local`、`api/.env`）を使用。API は `/etc/secrets/.env` があれば自動読み込み。
- `dev` 実行前に Stripe キー、Supabase の URL、DB 資格情報を確認。

## エージェント向けメモ

- スコープ: リポジトリ全体。変更は最小限に留め、Biome と既存構成に整合させる。アドホックなコマンドではなく、可能な限りルートスクリプトを使用する。
