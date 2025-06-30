# 多言語対応Webアプリケーション開発ガイド

このドキュメントでは、本テンプレートプロジェクトを使用した多言語対応Webアプリケーションの開発フローについて説明します。

## 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [開発環境のセットアップ](#開発環境のセットアップ)
3. [多言語対応の基本](#多言語対応の基本)
4. [新機能の追加フロー](#新機能の追加フロー)
5. [ベストプラクティス](#ベストプラクティス)
6. [トラブルシューティング](#トラブルシューティング)

## プロジェクト概要

本プロジェクトは、新規アプリ開発を爆速化するためのテンプレートアプリケーションです。以下の機能が実装済みです：

- ✅ 認証システム（メールアドレス認証・Google OAuth認証）
- ✅ ユーザープロフィール管理
- ✅ Supabase連携（認証・データベース）
- ✅ APIサーバー基盤（Hono）
- ✅ 共通UIコンポーネント（shadcn/ui）
- ✅ 多言語対応（日本語・英語）

## 開発環境のセットアップ

### 1. 環境変数の設定

`.env.example`をコピーして`.env.local`を作成し、必要な環境変数を設定します：

```bash
cp .env.example .env.local
```

### 2. 依存関係のインストール

```bash
# ルートディレクトリで
npm install

# フロントエンド
cd web && npm install

# バックエンド
cd ../api && npm install
```

### 3. Supabaseのセットアップ

```bash
# Supabase CLIのインストール（未インストールの場合）
brew install supabase/tap/supabase

# ローカルSupabaseの起動
supabase start
```

### 4. データベースのセットアップ

```bash
cd api
npm run db:push  # マイグレーションの実行
npm run db:seed  # シードデータの投入
```

### 5. 開発サーバーの起動

```bash
# フロントエンド（別ターミナル）
cd web
npm run dev  # http://localhost:3000

# バックエンド（別ターミナル）
cd api
npm run dev  # http://localhost:8080
```

## 多言語対応の基本

### 言語ファイルの構造

翻訳ファイルは`/web/src/messages/`ディレクトリに格納されています：

```
web/src/messages/
├── ja.json  # 日本語（デフォルト）
└── en.json  # 英語
```

### 新しい翻訳の追加方法

1. **翻訳キーの追加**
   
   `ja.json`と`en.json`の両方に新しいキーを追加：
   ```json
   // ja.json
   {
     "myFeature": {
       "title": "新機能",
       "description": "これは新しい機能です"
     }
   }
   
   // en.json
   {
     "myFeature": {
       "title": "New Feature",
       "description": "This is a new feature"
     }
   }
   ```

2. **コンポーネントでの使用**
   
   ```typescript
   'use client'
   
   import { useTranslations } from 'next-intl'
   
   export function MyComponent() {
     const t = useTranslations('myFeature')
     
     return (
       <div>
         <h1>{t('title')}</h1>
         <p>{t('description')}</p>
       </div>
     )
   }
   ```

### URLの構造

多言語対応により、URLは以下の構造になります：
- 日本語: `/ja/dashboard`、`/ja/signin`
- 英語: `/en/dashboard`、`/en/signin`

デフォルト言語（日本語）の場合、`/dashboard`でもアクセス可能です。

## 新機能の追加フロー

### 1. 新しいページの作成

```bash
# 例: 設定ページの作成
mkdir -p web/src/app/[locale]/(main)/settings
```

```typescript
// web/src/app/[locale]/(main)/settings/page.tsx
'use client'

import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('settings')
  
  return (
    <div>
      <h1>{t('title')}</h1>
    </div>
  )
}
```

### 2. 翻訳の追加

```json
// ja.json に追加
{
  "settings": {
    "title": "設定",
    "profile": "プロフィール設定",
    "notifications": "通知設定"
  }
}

// en.json に追加
{
  "settings": {
    "title": "Settings",
    "profile": "Profile Settings",
    "notifications": "Notification Settings"
  }
}
```

### 3. APIエンドポイントの追加

```typescript
// api/src/route/settings/index.ts
import { Hono } from 'hono'
import { createRoute } from '@hono/zod-openapi'

const app = new Hono()

const getSettingsRoute = createRoute({
  method: 'get',
  path: '/settings',
  responses: {
    200: {
      description: 'Settings retrieved successfully',
    },
  },
})

app.openapi(getSettingsRoute, async (c) => {
  // 実装
})

export default app
```

### 4. データベーススキーマの追加

```typescript
// api/src/drizzle/db/schema.ts に追加
export const settings = pgTable('settings', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.userId),
  notificationEmail: boolean('notification_email').default(true),
  language: varchar('language', { length: 5 }).default('ja'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
```

### 5. 型定義の生成

```bash
# APIスキーマから型定義を生成
npm run gen:api
```

## ベストプラクティス

### 1. コンポーネントの国際化

**❌ 悪い例：**
```typescript
<button>保存</button>
```

**✅ 良い例：**
```typescript
<button>{t('common.save')}</button>
```

### 2. 動的な翻訳

**変数を含む翻訳：**
```json
// ja.json
{
  "welcome": "ようこそ、{name}さん"
}
```

```typescript
t('welcome', { name: user.name })
```

### 3. 複数形の処理

```json
// ja.json
{
  "items": {
    "zero": "アイテムがありません",
    "one": "1個のアイテム",
    "other": "{count}個のアイテム"
  }
}
```

### 4. 日付・数値のフォーマット

```typescript
import { useFormatter } from 'next-intl'

function MyComponent() {
  const format = useFormatter()
  
  return (
    <div>
      {format.dateTime(new Date(), 'medium')}
      {format.number(1234.56, 'currency')}
    </div>
  )
}
```

### 5. SEO対応

```typescript
// ページごとにメタデータを多言語化
export async function generateMetadata({ params: { locale } }) {
  const t = await getTranslations({ locale, namespace: 'metadata' })
  
  return {
    title: t('title'),
    description: t('description'),
  }
}
```

## トラブルシューティング

### よくある問題と解決策

#### 1. 翻訳キーが見つからない
```
Missing message: "settings.title"
```
**解決策：** すべての言語ファイルに該当キーが存在することを確認

#### 2. リンクが正しく動作しない
**解決策：** 
```typescript
// ❌ 悪い例
<Link href="/dashboard">

// ✅ 良い例
<Link href={`/${locale}/dashboard`}>
// または next-intl/link を使用
```

#### 3. ミドルウェアでのエラー
**解決策：** `middleware.ts`の設定を確認し、除外パスが正しく設定されているか確認

### デバッグ方法

1. **翻訳キーの確認**
   ```typescript
   console.log(t.raw('key'))  // 翻訳前の値を確認
   ```

2. **現在の言語を確認**
   ```typescript
   const locale = useLocale()
   console.log('Current locale:', locale)
   ```

3. **翻訳ファイルの検証**
   ```bash
   # JSONの構文エラーをチェック
   npx jsonlint web/src/messages/ja.json
   ```

## まとめ

このテンプレートを使用することで、多言語対応の基盤が整った状態から開発を始められます。新機能を追加する際は、必ず翻訳ファイルも同時に更新し、すべてのユーザーが母国語でアプリケーションを利用できるようにしましょう。

詳細な技術仕様については、[CLAUDE.md](../CLAUDE.md)を参照してください。