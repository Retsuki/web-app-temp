# Google OAuth認証のセットアップ

このドキュメントでは、Google OAuth認証を有効にするために必要な手順を説明します。

## 前提条件

- Google Cloud Platform (GCP) アカウント
- Supabaseプロジェクト
- 本番環境のドメイン（開発環境では `localhost` を使用可能）

## セットアップ手順

### 1. Google Cloud Consoleでの設定

#### 1.1 プロジェクトの作成または選択

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択

#### 1.2 OAuth同意画面の設定

1. 左側のメニューから「APIとサービス」→「OAuth同意画面」を選択
2. User Typeを選択:
   - 内部テスト用: `Internal`（Google Workspace アカウントが必要）
   - 一般公開用: `External`
3. 必要な情報を入力:
   - アプリ名
   - ユーザーサポートメール
   - 開発者の連絡先情報
4. スコープは以下を追加:
   - `email`
   - `profile`
   - `openid`

#### 1.3 OAuth 2.0 クライアントIDの作成

1. 「APIとサービス」→「認証情報」→「認証情報を作成」→「OAuth クライアント ID」
2. アプリケーションの種類: `ウェブ アプリケーション`
3. 名前を入力（例: "My Web App OAuth"）
4. 承認済みのリダイレクトURIを追加:
   ```
   # Supabaseのコールバックエンドポイント
   https://<your-project-ref>.supabase.co/auth/v1/callback
   
   # 開発環境の場合
   http://localhost:54321/auth/v1/callback
   ```
5. 作成後、クライアントIDとクライアントシークレットをコピー

### 2. Supabaseでの設定

#### 2.1 Supabase Dashboardでの設定

1. [Supabase Dashboard](https://app.supabase.com/) にログイン
2. プロジェクトを選択
3. 左側のメニューから「Authentication」→「Providers」を選択
4. 「Google」を有効化
5. 以下の情報を入力:
   - **Client ID**: Google Cloud Consoleで取得したクライアントID
   - **Client Secret**: Google Cloud Consoleで取得したクライアントシークレット
6. 「Save」をクリック

#### 2.2 リダイレクトURLの確認

Supabaseのダッシュボードに表示される「Callback URL」をコピーし、Google Cloud ConsoleのOAuth設定に追加されていることを確認。

### 3. 環境変数の設定

#### 3.1 必要な環境変数

```bash
# .env.local (Next.js)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
NEXT_PUBLIC_SITE_URL=http://localhost:3000  # 本番環境では実際のURLに変更

# Supabase CLI用（ローカル開発時）
SUPABASE_AUTH_EXTERNAL_GOOGLE_ENABLED=true
SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID=<your-client-id>
SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET=<your-client-secret>
```

### 4. コードの実装確認

現在のプロジェクトには既に以下の実装が含まれています:

1. **Google認証アクション** (`/web/src/lib/auth/actions.ts`):
   ```typescript
   export async function signInWithGoogle() {
     const supabase = await createClient()
     
     const { data, error } = await supabase.auth.signInWithOAuth({
       provider: 'google',
       options: {
         redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
       },
     })
     
     if (error) {
       console.error('Error:', error)
       return
     }
     
     if (data.url) {
       redirect(data.url)
     }
   }
   ```

2. **Googleボタンコンポーネント** (`/web/src/components/app/button/google-button.tsx`)
3. **認証フォームラッパー** (`/web/src/components/app/auth/google-auth-form.tsx`)
4. **コールバックハンドラー** (`/web/src/app/auth/callback/route.ts`)

### 5. テスト手順

1. 開発サーバーを起動:
   ```bash
   cd web
   npm run dev
   ```

2. ブラウザで `http://localhost:3000/signup` または `http://localhost:3000/signin` にアクセス

3. 「Googleで登録」または「Googleでログイン」ボタンをクリック

4. Googleアカウントを選択してログイン

5. 正常にリダイレクトされ、ダッシュボードが表示されることを確認

## トラブルシューティング

### よくある問題と解決方法

#### 1. "Error 400: redirect_uri_mismatch"
- **原因**: Google Cloud ConsoleのリダイレクトURIが正しく設定されていない
- **解決策**: 
  - Supabase DashboardからCallback URLをコピー
  - Google Cloud ConsoleのOAuth設定に追加
  - URLが完全に一致していることを確認（末尾のスラッシュも含む）

#### 2. "Invalid Site URL"
- **原因**: 環境変数 `NEXT_PUBLIC_SITE_URL` が設定されていない
- **解決策**: `.env.local` に正しいURLを設定

#### 3. 認証後にリダイレクトされない
- **原因**: コールバックルートが正しく実装されていない
- **解決策**: `/web/src/app/auth/callback/route.ts` が存在し、正しく実装されていることを確認

#### 4. プロファイル情報が保存されない
- **原因**: データベーストリガーが設定されていない
- **解決策**: Supabaseのマイグレーションが正しく適用されていることを確認

## セキュリティの考慮事項

1. **本番環境では必ずHTTPSを使用**
2. **クライアントシークレットは絶対にフロントエンドのコードに含めない**
3. **環境変数は `.gitignore` に含めて、リポジトリにコミットしない**
4. **定期的にOAuthクライアントのアクセスログを確認**

## 参考リンク

- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Next.js Environment Variables](https://nextjs.org/docs/pages/building-your-application/configuring/environment-variables)