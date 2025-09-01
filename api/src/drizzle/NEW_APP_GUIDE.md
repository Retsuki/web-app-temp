# 新規アプリ（apps/<app>）追加ガイド（sample と同様の構成）

本ガイドは、`apps/sample` と同じパターンで新しいアプリ用のスキーマ／マイグレーション運用を追加する手順です。目的は「ランタイムと生成(drizzle-kit)を分離」「アプリ毎に安全にマイグレーションを独立運用」することです。

---

## 1) ディレクトリ構成を作る

`api/src/drizzle/db/apps/<app>/` 配下に以下を作成します。

```
api/src/drizzle/db/apps/<app>/
  ├─ schema/
  │   ├─ core.ts           # 唯一のスキーマ定義（pgEnum/テーブル/relations すべて）
  │   └─ drizzle-kit.ts    # 生成用アダプタ（拡張子なし re-export）
  ├─ index.ts              # ランタイム用エクスポート（core.js を re-export）
  └─ types.ts              # 型（Infer 型）定義（core.js を import）
```

雛形（例）

schema/core.ts（最低限の形）

```ts
import { relations, sql } from 'drizzle-orm'
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { profiles } from '../../../shared/common-schema.js'

// enum はここで pgEnum として「アプリ接頭辞付き」で定義（衝突回避）
export const <app>PlanEnum = pgEnum('<app>_plan', ['free', 'indie', 'pro'])

export const <app>Projects = pgTable('<app>_projects', {
  id: uuid('id').default(sql`gen_random_uuid()`).primaryKey(),
  userId: uuid('user_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  // ... 任意の列
  createdAt: timestamp('created_at').default(sql`now()`).notNull(),
  updatedAt: timestamp('updated_at').default(sql`now()`).notNull(),
})

export const <app>ProjectsRelations = relations(<app>Projects, () => ({}))
```

schema/drizzle-kit.ts（生成用アダプタ）

```ts
export * from './core'
```

index.ts（ランタイム用アダプタ。NodeNext なので .js が必要）

```ts
export * from './schema/core.js'
export * from './types.js'
```

types.ts（Infer 型は core.js を参照）

```ts
import type { <app>Projects } from './schema/core.js'
export type <App>Project = typeof <app>Projects.$inferSelect
export type New<App>Project = typeof <app>Projects.$inferInsert
```

---

## 2) ランタイム DB スキーマへ追加

`api/src/drizzle/db/database.ts` に新アプリのエクスポートをマージします（DB 型参照用）。

```ts
import * as baseSchema from './schema.js'
import * as sampleSchema from './apps/sample/index.js'
import * as omSchema from './apps/om/index.js'         // 既存例
import * as pmtSchema from './apps/pmt/index.js'       // 既存例
import * as <app>Schema from './apps/<app>/index.js'   // 追加

const schema = { ...baseSchema, ...sampleSchema, ...omSchema, ...pmtSchema, ...<app>Schema } as const
```

注意: ランタイムは `.js` 拡張子の解決が必要なため、`index.ts` で `./schema/core.js` を re-export しておくのがポイントです。

---

## 3) アプリ専用の drizzle 設定を作成

`api/drizzle.<app>.config.ts` を作成し、生成対象・出力先をアプリ専用にします。

```ts
import * as dotenv from 'dotenv'
import { defineConfig } from 'drizzle-kit'

dotenv.config({ path: '../.env' })

export default defineConfig({
  schema: './src/drizzle/db/apps/<app>/schema/drizzle-kit.ts',
  out: './src/drizzle/migrations/<app>',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:54322/postgres',
  },
  verbose: true,
  strict: false, // 他アプリのテーブル削除を避けるため安全側
})
```

---

## 4) NPM スクリプトを追加（生成・適用は migrate を使用）

`api/package.json` にコマンドを追加します（誤操作防止のため既定の db:push/db:generate は無効化済み）。

```json
{
  "scripts": {
    "db:generate:<app>": "drizzle-kit generate --config drizzle.<app>.config.ts",
    "db:push:<app>": "drizzle-kit migrate --config drizzle.<app>.config.ts"
  }
}
```

実行手順:

```
cd api
npm run db:generate:<app>
npm run db:push:<app>
```

ポイント:
- push ではなく migrate を使用します（生成済み SQL の適用のみを行い、他アプリのテーブル削除が走らない）
- `strict: false` を設定し、スキーマ外リソースを削除しない

---

## 5) 命名規約と注意点

- enum 名やテーブル名はアプリ接頭辞（`<app>_`）を付けて衝突を回避
- 生成用（drizzle-kit）とランタイムのモジュール解決は別物
  - 生成用: 拡張子なし re-export（`export * from './core'`）
  - ランタイム: NodeNext で `.js` 必須（`export * from './core.js'`）
- 共有テーブル参照（profiles など）は `../../../shared/common-schema.js` を参照
- マイグレーションはアプリ毎に `src/drizzle/migrations/<app>` に出力され、DB内の履歴テーブルに順次記録されます（他アプリと共存可）。

---

## 6) 追加オプション（任意）

- Seed スクリプト: `src/drizzle/db/seed/<app>-*.ts` を作成し、`package.json` に `db:seed:<app>` を追加
- DB ファースト運用: DB 先行変更 → `drizzle-kit introspect` で型を取り込み、生成用スキーマには含めない（= migrate 管理外）
- CI 連携: `drizzle-kit generate --config drizzle.<app>.config.ts --print` で差分レビュー後に `migrate` 実行

---

## 7) 参考（既存アプリ）

- sample: `apps/sample/schema/core.ts`, `apps/sample/schema/drizzle-kit.ts`
- om: `apps/om/schema/core.ts`, `apps/om/schema/drizzle-kit.ts`
- pmt: `apps/pmt/schema/core.ts`, `apps/pmt/schema/drizzle-kit.ts`

それぞれ `api/drizzle.<app>.config.ts` と `package.json` の `db:generate:<app>`, `db:push:<app>` を参照してください。

