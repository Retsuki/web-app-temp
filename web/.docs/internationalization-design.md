# 多言語対応（国際化）設計書

## 概要

本設計書は、web_app_tempプロジェクトのフロントエンドアプリケーションに多言語対応機能を実装するための技術設計をまとめたものです。

## 現状分析

### 背景
- プロジェクトでは以前next-intlを使用した多言語対応が実装されていた
- コミット`aa3ef33`にて一時的に多言語機能が削除された
- 現在は単一言語（日本語）での動作となっている
- package.jsonにはnext-intlの依存関係が残存

### 削除された機能
1. 日本語・英語の2言語対応
2. URLベースのロケール切り替え（`/ja/`, `/en/`）
3. 翻訳ファイル管理システム
4. 言語切り替えUI

## 設計方針

### 1. フレームワーク選定
**next-intl**を引き続き採用
- Next.js App Routerとの高い親和性
- 型安全な翻訳システム
- Server/Client Componentsの両方をサポート
- 実績のあるライブラリ

### 2. 対応言語
初期実装では以下の2言語をサポート：
- **日本語** (`ja`) - デフォルト言語
- **英語** (`en`)

将来的な拡張を考慮した設計とする。

### 3. ルーティング戦略
**サブパスルーティング**を採用
- URL構造: `/{locale}/{path}`
- 例: `/ja/dashboard`, `/en/signin`
- `localePrefix: 'always'`設定でロケールを常に表示

理由：
- SEOに有利
- URLから言語が明確
- ブックマーク・共有時に言語情報を保持

## 実装計画

### Phase 1: 基盤構築

#### 1.1 ディレクトリ構造の変更
```
/src/app/
├── [locale]/                # ロケール動的セグメント
│   ├── (auth)/             # 認証グループ
│   │   ├── signin/
│   │   └── signup/
│   ├── (main)/             # メインアプリグループ
│   │   └── dashboard/
│   ├── layout.tsx          # ロケール別レイアウト
│   └── page.tsx            # ホームページ
├── auth/callback/          # OAuth認証コールバック（ロケール外）
└── globals.css
```

#### 1.2 設定ファイル
```typescript
// /web/src/i18n/config.ts
export const locales = ['ja', 'en'] as const;
export const defaultLocale = 'ja' as const;
export type Locale = (typeof locales)[number];

// /web/src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['ja', 'en'],
  defaultLocale: 'ja',
  localePrefix: 'always'
});

export const { Link, redirect, usePathname, useRouter } = 
  createNavigation(routing);
```

#### 1.3 ミドルウェアの実装
```typescript
// /web/src/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(ja|en)/:path*']
};
```

### Phase 2: 翻訳システム

#### 2.1 翻訳ファイル構造
```
/src/messages/
├── ja.json
└── en.json
```

翻訳ファイルの構造：
```json
{
  "common": {
    "appName": "Web App Template",
    "loading": "読み込み中...",
    "error": "エラーが発生しました"
  },
  "auth": {
    "signIn": "ログイン",
    "signUp": "新規登録",
    "signOut": "ログアウト"
  },
  "navigation": {
    "home": "ホーム",
    "dashboard": "ダッシュボード",
    "profile": "プロフィール"
  }
}
```

#### 2.2 翻訳ヘルパー関数
```typescript
// /web/src/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { Locale } from './config';

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default
}));
```

### Phase 3: コンポーネント実装

#### 3.1 Server Components での使用
```typescript
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('auth');
  
  return <h1>{t('signIn')}</h1>;
}
```

#### 3.2 Client Components での使用
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function LoginForm() {
  const t = useTranslations('auth');
  
  return <button>{t('signIn')}</button>;
}
```

#### 3.3 言語切り替えコンポーネント
```typescript
// /web/src/components/app/language-switcher.tsx
'use client';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  
  const handleChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };
  
  return (
    <select value={locale} onChange={(e) => handleChange(e.target.value)}>
      <option value="ja">日本語</option>
      <option value="en">English</option>
    </select>
  );
}
```

### Phase 4: 既存コンポーネントの移行

#### 4.1 優先度の高いコンポーネント
1. 認証関連（SignIn, SignUp）
2. ナビゲーション（Header, Footer）
3. エラーメッセージ
4. バリデーションメッセージ

#### 4.2 移行手順
1. 翻訳キーの定義
2. ハードコードされたテキストの抽出
3. 翻訳関数の適用
4. 両言語でのテスト

## 技術的考慮事項

### 1. パフォーマンス
- Server Componentsでの翻訳はビルド時に解決
- Client Components用の翻訳は必要最小限に
- 翻訳ファイルの分割によるバンドルサイズ最適化

### 2. 型安全性
- TypeScriptの型定義を自動生成
- 翻訳キーの存在を型レベルで保証
- IDEでの自動補完サポート

### 3. SEO対策
- `hreflang`タグの自動生成
- 言語別のメタデータ管理
- サイトマップの多言語対応

### 4. ユーザビリティ
- ブラウザの言語設定を自動検出
- 選択した言語をCookieに保存
- 言語切り替え時のページ位置保持

## 実装スケジュール

### Week 1
- [ ] 基盤構築（ディレクトリ構造、設定ファイル）
- [ ] ミドルウェアの実装
- [ ] 翻訳ファイルの基本構造作成

### Week 2
- [ ] 認証関連コンポーネントの多言語化
- [ ] ナビゲーションコンポーネントの多言語化
- [ ] 言語切り替えUIの実装

### Week 3
- [ ] その他のコンポーネントの多言語化
- [ ] エラーメッセージ・バリデーションの多言語化
- [ ] テストとデバッグ

### Week 4
- [ ] SEO対策の実装
- [ ] パフォーマンス最適化
- [ ] ドキュメント整備

## テスト計画

### 1. 単体テスト
- 翻訳関数の動作確認
- ロケール切り替えロジック
- ミドルウェアの動作

### 2. 統合テスト
- 言語切り替え時の画面遷移
- フォームバリデーションの多言語表示
- APIエラーメッセージの表示

### 3. E2Eテスト
- ユーザーフローの多言語動作確認
- SEOタグの生成確認
- パフォーマンス測定

## リスクと対策

### 1. 翻訳品質
- **リスク**: 機械翻訳による品質低下
- **対策**: ネイティブスピーカーによるレビュー

### 2. メンテナンス性
- **リスク**: 翻訳ファイルの肥大化
- **対策**: 機能別にファイル分割、翻訳管理ツールの導入検討

### 3. パフォーマンス
- **リスク**: 翻訳処理によるレンダリング遅延
- **対策**: Server Componentsの活用、キャッシュ戦略

## 将来の拡張

### 1. 追加言語サポート
- 中国語（簡体字・繁体字）
- 韓国語
- スペイン語

### 2. 高度な機能
- 地域別の表示カスタマイズ
- 右から左（RTL）言語のサポート
- 翻訳管理システムの統合

### 3. コンテンツ管理
- CMSとの連携
- 動的コンテンツの多言語対応
- ユーザー生成コンテンツの翻訳

## まとめ

本設計書に基づいて多言語対応を実装することで、グローバルなユーザーベースに対応可能なアプリケーションを構築できます。段階的な実装により、リスクを最小限に抑えながら、確実に機能を追加していきます。