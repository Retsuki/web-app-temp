# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリのコードを扱う際のガイダンスを提供します。

## フロントエンド概要

これは Web アプリテンプレートプロジェクトの Next.js フロントエンドアプリケーションです。Next.js 15 App Router を使用した最新の React パターンを採用し、型安全で国際化対応された高パフォーマンスなユーザーインターフェースを提供します。

### コア技術
- **Next.js 15.3.4** App Router と Turbopack
- **TypeScript** 型安全性のため
- **Tailwind CSS v4** CSS 変数使用
- **shadcn/ui** コンポーネントライブラリ
- **React Hook Form + Zod** フォーム用
- **TanStack Query** サーバー状態管理
- **Supabase** 認証・データベース用
- **Stripe** 決済処理用（実装済み）
- **MSW** API モッキング用
- **Sonner** トースト通知用

## アーキテクチャパターン

### ディレクトリ構造
```
/src/
├── app/                    # Next.js App Router
│   ├── [lang]/            # 言語ルーティング (ja/en)
│   │   ├── (auth)/        # 認証グループレイアウト
│   │   │   ├── signin/    # サインインページ
│   │   │   ├── signup/    # サインアップページ
│   │   │   └── auth/      # 認証関連
│   │   │       └── callback/ # OAuth コールバック
│   │   ├── (main)/        # メインアプリグループ（認証必須）
│   │   │   ├── dashboard/ # ダッシュボード
│   │   │   ├── billing/   # 請求管理ページ
│   │   │   └── pricing/   # 料金プランページ
│   │   ├── (public)/      # パブリックページ
│   │   │   ├── legal/     # 法的文書
│   │   │   ├── privacy-policy/ # プライバシーポリシー
│   │   │   └── terms/     # 利用規約
│   │   ├── checkout/      # チェックアウトフロー
│   │   │   ├── success/   # 決済成功ページ
│   │   │   └── cancel/    # 決済キャンセルページ
│   │   └── page.tsx       # ホームページ
│   ├── (ui)/              # UIショーケース
│   ├── dictionaries/      # 翻訳ファイル
│   │   ├── ja.json        # 日本語翻訳
│   │   └── en.json        # 英語翻訳
│   └── layout.tsx         # ルートレイアウト
├── components/
│   ├── ui/                # shadcn/ui ベースコンポーネント
│   └── app/               # アプリケーションコンポーネント
│       ├── button/        # カスタムボタン
│       ├── checkbox/      # フォームチェックボックス
│       ├── input/         # フォーム入力
│       ├── radio/         # ラジオボタングループ
│       ├── profile/       # ユーザープロフィール
│       ├── provider/      # アプリケーションプロバイダー
│       │   └── app-provider.tsx # QueryClient & Auth Provider
│       └── language-switcher.tsx # 言語切り替え
├── features/              # 機能別モジュール（Bulletproof React）
│   └── auth/             # 認証機能
│       ├── components/   # 認証関連コンポーネント
│       │   └── google-auth-form.tsx
│       ├── hooks/        # カスタムフック
│       │   └── auth-context.tsx # AuthProvider & useAuth
│       ├── server/       # サーバーサイド処理
│       │   ├── auth-actions.ts  # Server Actions
│       │   └── auth-server.ts   # サーバー側ユーティリティ
│       ├── types/        # 型定義
│       │   └── index.ts
│       └── index.ts      # Public API
├── lib/
│   ├── api/              # API クライアント & 型
│   │   ├── schema.d.ts   # 自動生成された型定義
│   │   ├── orval-client.ts # クライアントサイドAPI
│   │   ├── orval-server-client.ts # サーバーサイドAPI
│   │   └── server-api.ts # サーバーAPIユーティリティ
│   ├── supabase/         # Supabase クライアント
│   └── utils.ts          # ユーティリティ関数
├── public/
│   └── mockServiceWorker.js # MSW サービスワーカー
└── middleware.ts         # 認証 & 国際化ミドルウェア
```

### コンポーネント設計パターン

#### 1. UI コンポーネント (`/components/ui/`)
- shadcn/ui からのベースコンポーネント
- ビジネスロジックなし、純粋な表示用
- 機能間で高い再利用性
- 例: Button, Input, Card, Dialog

#### 2. App コンポーネント (`/components/app/`)
- アプリケーション固有のコンポーネント
- ビジネスロジックを含む可能性
- UI コンポーネントから構成
- 例: UserProfileExample, LanguageSwitcher, FormInput, FormCheckbox, FormRadioGroup

#### 3. 機能コンポーネント（ルートフォルダー内）
- ページ固有のコンポーネント
- ルートと密結合
- Server または Client Components
- 例: DashboardStats, SettingsForm

### 状態管理戦略

#### サーバー状態
- **TanStack Query** API データ用
- `useQuery` と `useMutation` を使用したカスタムフック
- 自動キャッシングと同期
- 例:
```typescript
// クライアントコンポーネント内で
const { data, isLoading } = useUserProfile();
```

#### クライアント状態
- **React Context** グローバル UI 状態（認証）用
- **React Hook Form** フォーム状態用
- **URL 状態** フィルター/ページネーション用
- UI インタラクション用のローカルコンポーネント状態

### フォーム処理パターン
```typescript
// すべてのフォームはこのパターンを使用:
1. Zod スキーマでバリデーション
2. React Hook Form で状態管理
3. Server Action または API ミューテーション
4. ローディング/エラー状態
5. 成功フィードバック
```

### API 統合アーキテクチャ

#### 型安全な API クライアント
```typescript
// 認証済みリクエスト（クライアントサイド）
import { createClient } from '@/lib/api/orval-client';
const client = await createClient();
const { data } = await client.GET('/api/v1/users/profile');

// 認証済みリクエスト（サーバーサイド）
import { createServerClient } from '@/lib/api/orval-server-client';
const client = await createServerClient();
const { data } = await client.GET('/api/v1/users/profile');

// パブリックエンドポイント
import { apiClient } from '@/lib/api/orval-client';
const { data } = await apiClient.GET('/api/v1/health');
```

#### データフェッチパターン
1. **Server Components**: コンポーネント内で直接フェッチ
2. **Client Components**: TanStack Query フック
3. **Server Actions**: フォーム送信
4. **Route Handlers**: 必要に応じて API プロキシ

## ルーティング & ミドルウェア

### App Router 構造
- `[lang]` 国際化用の動的セグメント（注: [locale]ではなく[lang]を使用）
- ルートグループ:
  - `(auth)` 認証関連ページ
  - `(main)` 認証必須のメインアプリ
  - `(public)` 公開ページ（法的文書など）
- チェックアウトフロー用の専用ルート
- ファイル規約: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### ミドルウェアチェーン
1. **ロケール検出**: 適切なロケールへリダイレクト
2. **認証チェック**: 認証が必要なルートを保護
3. **ルートガード**: 認証状態に基づくリダイレクト

### 保護されたルート
- `/[lang]/(main)/*` 認証が必要（ダッシュボード、請求、料金プラン）
- `/[lang]/(auth)/*` 認証済みの場合リダイレクト
- `/[lang]/checkout/*` 決済フロー（認証必須）
- `/[lang]/(public)/*` 常にアクセス可能
- ミドルウェアがすべてのリダイレクトを処理

## 認証フロー

### 認証機能の構成 (Bulletproof React Pattern)
```
/features/auth/
├── components/      # 認証用UIコンポーネント
│   └── google-auth-form.tsx
├── hooks/          # カスタムフック
│   └── auth-context.tsx  # AuthProvider & useAuth
├── server/         # サーバーサイド処理
│   ├── auth-actions.ts   # Server Actions
│   └── auth-server.ts    # サーバーユーティリティ
├── types/          # 型定義
│   └── index.ts
└── index.ts        # Public API
```

### クライアントサイド認証
```typescript
// useAuth フックが提供するもの:
import { useAuth } from '@/features/auth';

const { user, loading, signOut, refreshSession } = useAuth();
```

### サーバーサイド認証
```typescript
// Server Components 内で:
import { requireAuth } from '@/features/auth';
const { profile, error } = await requireAuth();

// Server Actions:
import { signIn, signUp, signOut, signInWithGoogle } from '@/features/auth';
```

### OAuth フロー
1. ユーザーが「Google でサインイン」をクリック
2. Google OAuth へリダイレクト
3. `/[lang]/(auth)/auth/callback` へコールバック
4. トークン交換とリダイレクト
5. ユーザーコンテキスト更新

## スタイリングシステム

### Tailwind CSS v4
- テーマ用の CSS 変数
- ライト/ダークモードサポート
- カスタムカラーシステム:
  - プライマリー: Mindaro (#90d80a)
  - セカンダリー: 深緑 (#44670d)

### コンポーネントスタイリングパターン
```typescript
// 条件付きクラス用に cn() ユーティリティを使用
import { cn } from '@/lib/utils';

className={cn(
  "base-classes",
  isActive && "active-classes",
  className // オーバーライド可能
)}
```

### CSS 変数
- `globals.css` で定義
- セマンティックな命名 (--primary, --background)
- 自動ダークモード切り替え

## パフォーマンス最適化

### デフォルトで Server Components
- 'use client' がない限りすべてのコンポーネントは Server Components
- クライアントバンドルサイズを削減
- 初期ロードパフォーマンス向上

### データフェッチング
- Server Components での並列データフェッチ
- React cache() でリクエストメモ化
- Suspense 境界でのストリーミング

### 画像最適化
- すべての画像で `next/image` を使用
- 自動フォーマット変換
- デフォルトで遅延読み込み

### コード分割
- 自動ルートベース分割
- 重いコンポーネントの動的インポート
- 高速な開発ビルド用 Turbopack

## 開発ガイドライン

### コンポーネント作成チェックリスト
1. 決定: Server または Client Component?
2. 適切なディレクトリを選択
3. TypeScript で実装
4. 適切なエラー境界を追加
5. ローディング状態を含める
6. 両方のロケールでテスト
7. モバイルレスポンシブ性を確認

### フォーム開発パターン
1. Zod スキーマを定義
2. React Hook Form でフォームコンポーネント作成
3. 送信ハンドラーを実装
4. ローディング/エラー状態を追加
5. バリデーションをテスト
6. 成功フィードバックを追加

### API 統合手順
1. OpenAPI にエンドポイントが存在するか確認
2. 必要に応じて `npm run api:schema` を実行
3. 適切なクライアント（認証/パブリック）を使用
4. ローディング/エラー状態を処理
5. 適切な TypeScript 型を実装

### デバッグのヒント
- React DevTools でコンポーネント検査
- API 呼び出し用にネットワークタブをチェック
- アプリケーションタブで認証トークンを確認
- Server Components で `console.log` を使用
- クライアントエラー用にブラウザコンソールをチェック

## 一般的なパターン

### ローディング状態
```typescript
// Server Components 用に Suspense を使用
<Suspense fallback={<LoadingSkeleton />}>
  <AsyncComponent />
</Suspense>

// Client Components 用にローディング状態を使用
if (isLoading) return <Spinner />;
```

### エラーハンドリング
```typescript
// コンポーネント用エラー境界
// Server Actions 用 try-catch
// React Query のエラー状態
// ユーザーフィードバック用トースト通知
```

### 空の状態
```typescript
if (!data || data.length === 0) {
  return <EmptyState message={t('no-data')} />;
}
```

## テスト戦略

### 現在の状態
- テストフレームワークは未実装
- 型安全性は TypeScript に依存
- MSW (Mock Service Worker) がセットアップ済み
- 手動テストが必要

### 推奨アプローチ
1. React Testing Library でコンポーネントテスト
2. Playwright で E2E テスト
3. MSW で API モッキング（すでに利用可能）
4. アクセシビリティテスト

## デプロイの考慮事項

### 環境変数
- ローカル開発用に `.env.local` を使用
- シークレットは絶対にコミットしない
- ビルド時にすべての環境変数を検証

### ビルド最適化
- エラーチェック用に `npm run build` を実行
- バンドルサイズを監視
- 大きなコンポーネントには動的インポートを使用
- 適切なキャッシュヘッダーを実装

### パフォーマンス監視
- Next.js 組み込みアナリティクスを使用
- Core Web Vitals を監視
- エラートラッキング設定（Sentry）
- API レスポンス時間を監視

## 重要な注意事項

### 常に覚えておくこと
1. **Server Components ファースト**: 必要な時のみ Client Components を使用
2. **型安全性**: TypeScript を完全に活用
3. **アクセシビリティ**: セマンティック HTML と ARIA ラベルを使用
4. **モバイルファースト**: モバイル用に設計、デスクトップ用に拡張
5. **パフォーマンス**: 測定と最適化
6. **セキュリティ**: 機密データを公開しない
7. **コード品質**: コミット前に `npm run lint` を実行
8. **API スキーマ同期**: API変更時は `npm run api:schema` で型を更新

### 避けるべき一般的な落とし穴
- Client Components を不必要に使用しない
- 大きなクライアントサイドバンドルを避ける
- 複数の場所でデータをフェッチしない
- プロップドリルを避ける（Context/Query を使用）
- TypeScript エラーを無視しない
- インラインスタイルを避ける（Tailwind を使用）
- ローディング/エラー状態をスキップしない

### クイックコマンド
```bash
# 開発
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run lint         # リンター実行
npm run gen:api      # API 型生成
npm run api:schema   # APIスキーマ取得と型生成

# コード品質
npm run check        # Biome チェック
npm run check:apply  # 問題を修正
npm run format       # コードフォーマット
```

## 新機能の実装状況

### 実装済み機能
- **決済システム**: Stripe 連携で完全実装
  - サブスクリプション管理
  - 料金プラン選択ページ
  - チェックアウトフロー
  - Webhook 処理
- **請求管理**: ユーザー向け請求ページ
- **法的文書**: 利用規約、プライバシーポリシー
- **トースト通知**: Sonner でユーザーフィードバック

### フォームコンポーネント拡充
- **FormCheckbox**: チェックボックスコンポーネント
- **FormRadioGroup**: ラジオボタングループ
- すべて React Hook Form と統合済み

### API 拡充
- ユーザープロフィール API
- 決済・サブスクリプション API
- Webhook ハンドリング
- プラン管理 API

# 重要な指示リマインダー
求められたことだけを実行する。それ以上でも以下でもない。
目的達成に絶対必要でない限り、ファイルを作成しない。
常に新規作成より既存ファイルの編集を優先する。
ユーザーから明示的に要求されない限り、ドキュメントファイル（*.md）や README ファイルを積極的に作成しない。

## 国際化の変更点
- **ルーティング**: `[locale]` ではなく `[lang]` を使用
- **翻訳ファイル**: `app/dictionaries/` 内に配置（`messages/` ディレクトリは存在しない）
- **i18n 設定**: `i18n/` ディレクトリは存在しない（簡素化された実装）