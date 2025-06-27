# 認証システムの設定と実装

## 概要
このアプリケーションでは、Supabase Authを使用して以下の認証方法を提供しています：
- メールアドレス/パスワード認証
- Google OAuth認証

## 環境変数の設定

### 必須の環境変数
```bash
# Supabase（ローカル開発用）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:54321/auth/v1/callback

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### Google OAuth設定手順

1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. プロジェクトを作成または選択
3. APIとサービス > 認証情報 に移動
4. OAuth 2.0クライアントIDを作成
5. アプリケーションの種類：「ウェブアプリケーション」を選択
6. 承認済みのリダイレクトURIに以下を追加：
   - ローカル開発用: `http://localhost:54321/auth/v1/callback`
   - 本番環境用: `https://your-supabase-project.supabase.co/auth/v1/callback`

### Supabaseローカル環境でのGoogle認証設定

1. `supabase/config.toml`でGoogle認証が有効になっていることを確認：
```toml
[auth.external.google]
enabled = true
client_id = "env(GOOGLE_CLIENT_ID)"
secret = "env(GOOGLE_CLIENT_SECRET)"
redirect_uri = "env(GOOGLE_REDIRECT_URI)"
skip_nonce_check = true  # ローカル開発時に必要
```

2. 環境変数ファイル（`.env`）に上記の設定を追加

3. Supabaseを再起動して設定を反映：
```bash
supabase stop
supabase start
```

## 実装の詳細

### 認証フロー

1. **サインアップ/サインイン画面**
   - `/signin` - サインイン画面
   - `/signup` - サインアップ画面

2. **認証コールバック**
   - `/auth/callback` - OAuth認証後のリダイレクト先

3. **保護されたルート**
   - `/dashboard` - 認証済みユーザーのみアクセス可能

### ミドルウェアによる認証チェック

`middleware.ts`で認証が必要なルートを保護しています：

```typescript
// 保護されたルート
const protectedRoutes = [
  '/dashboard',
  // その他の保護されたルート
]

// 認証不要なルート
const publicRoutes = [
  '/',
  '/signin',
  '/signup',
  '/auth/callback',
]
```

### Google認証の実装

`GoogleAuthForm`コンポーネント（`components/app/auth/google-auth-form.tsx`）で実装：

```typescript
const handleGoogleSignIn = async () => {
  const supabase = createClient()
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
}
```

## トラブルシューティング

### "Unsupported provider" エラー
- 原因：Google認証プロバイダーが有効になっていない
- 解決策：
  1. `supabase/config.toml`でGoogle認証が有効になっているか確認
  2. 環境変数が正しく設定されているか確認
  3. Supabaseを再起動

### リダイレクトエラー
- 原因：リダイレクトURIが一致しない
- 解決策：
  1. Google Cloud ConsoleのリダイレクトURIを確認
  2. 環境変数の`GOOGLE_REDIRECT_URI`を確認
  3. ローカル開発では`http://localhost:54321/auth/v1/callback`を使用

### 認証後のリダイレクト先
- デフォルトでは`/dashboard`にリダイレクト
- `middleware.ts`で変更可能

## セキュリティ考慮事項

1. **環境変数の管理**
   - `.env`ファイルはGitにコミットしない
   - 本番環境では環境変数を安全に管理

2. **Row Level Security (RLS)**
   - Supabaseデータベースで適切なRLSポリシーを設定
   - ユーザーは自分のデータのみアクセス可能

3. **セッション管理**
   - Supabase Authが自動的にセッションを管理
   - JWTトークンは安全に保存される