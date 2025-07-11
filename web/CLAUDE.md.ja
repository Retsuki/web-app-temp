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
- **next-intl** 国際化対応 (ja/en)
- **Supabase** 認証用

## アーキテクチャパターン

### ディレクトリ構造
```
/src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # ロケールルーティング (ja/en)
│   │   ├── (auth)/        # 認証グループレイアウト
│   │   │   ├── signin/    # サインインページ
│   │   │   └── signup/    # サインアップページ
│   │   ├── (main)/        # メインアプリグループ
│   │   │   └── dashboard/ # 保護されたダッシュボード
│   │   └── page.tsx       # ホームページ
│   ├── auth/callback/     # OAuth コールバックハンドラー
│   └── layout.tsx         # ルートレイアウト
├── components/
│   ├── ui/                # shadcn/ui ベースコンポーネント
│   └── app/               # アプリケーションコンポーネント
│       ├── auth/          # 認証関連コンポーネント
│       ├── button/        # カスタムボタン
│       ├── input/         # フォーム入力
│       └── providers/     # コンテキストプロバイダー
├── lib/
│   ├── api/              # API クライアント & 型
│   ├── auth/             # 認証ユーティリティ
│   ├── supabase/         # Supabase クライアント
│   └── utils.ts          # ユーティリティ関数
├── i18n/                 # 国際化
│   ├── routing.ts        # ロケールルーティング設定
│   └── request.ts        # サーバーリクエストヘルパー
├── messages/             # 翻訳ファイル
│   ├── ja.json          # 日本語翻訳
│   └── en.json          # 英語翻訳
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
- 例: SignInForm, UserProfile, LanguageSwitcher

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
// 認証済みリクエスト
const client = createAuthenticatedClient();
const { data } = await client.GET('/api/v1/users/profile');

// パブリックエンドポイント
const { data } = await apiClient.GET('/api/v1/health');
```

#### データフェッチパターン
1. **Server Components**: コンポーネント内で直接フェッチ
2. **Client Components**: TanStack Query フック
3. **Server Actions**: フォーム送信
4. **Route Handlers**: 必要に応じて API プロキシ

## ルーティング & ミドルウェア

### App Router 構造
- `[locale]` 国際化用の動的セグメント
- ルートグループ `(auth)` と `(main)` でレイアウト管理
- パラレルルートとインターセプティングルートをサポート
- ファイル規約: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### ミドルウェアチェーン
1. **ロケール検出**: 適切なロケールへリダイレクト
2. **認証チェック**: 認証が必要なルートを保護
3. **ルートガード**: 認証状態に基づくリダイレクト

### 保護されたルート
- `/[locale]/(main)/*` 認証が必要
- `/[locale]/(auth)/*` 認証済みの場合リダイレクト
- ミドルウェアがすべてのリダイレクトを処理

## 認証フロー

### クライアントサイド認証
```typescript
// AuthContext が提供するもの:
- user: 現在のユーザーオブジェクト
- signIn: メール/パスワードでサインイン
- signUp: メール/パスワードでサインアップ
- signInWithGoogle: OAuth サインイン
- signOut: セッションクリア
- loading: 認証状態ローディング
```

### サーバーサイド認証
```typescript
// Server Components 内で:
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();

// Server Actions 内で:
const user = await getUser(); // ヘルパー関数
```

### OAuth フロー
1. ユーザーが「Google でサインイン」をクリック
2. Google OAuth へリダイレクト
3. `/auth/callback` へコールバック
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
- 手動テストが必要

### 推奨アプローチ
1. React Testing Library でコンポーネントテスト
2. Playwright で E2E テスト
3. MSW で API モッキング
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

# コード品質
npm run check        # Biome チェック
npm run check:apply  # 問題を修正
npm run format       # コードフォーマット
```

# 重要な指示リマインダー
求められたことだけを実行する。それ以上でも以下でもない。
目的達成に絶対必要でない限り、ファイルを作成しない。
常に新規作成より既存ファイルの編集を優先する。
ユーザーから明示的に要求されない限り、ドキュメントファイル（*.md）や README ファイルを積極的に作成しない。