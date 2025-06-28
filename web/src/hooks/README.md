# 認証・ユーザー管理フック

このディレクトリには、認証とユーザー管理に関するカスタムフックが含まれています。

## 使用方法

### Client Component での使用

```tsx
'use client'

import { useAuth } from '@/contexts/auth-context'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useAuthToken } from '@/hooks/use-auth-token'

function MyComponent() {
  // 認証状態とユーザー情報
  const { user, loading, signOut } = useAuth()
  
  // APIから取得したプロフィール情報
  const { user: profile, isLoading, error } = useCurrentUser()
  
  // アクセストークンのみ必要な場合
  const { token } = useAuthToken()
  
  if (loading || isLoading) {
    return <div>読み込み中...</div>
  }
  
  if (!user || !profile) {
    return <div>ログインしてください</div>
  }
  
  return (
    <div>
      <h1>こんにちは、{profile.nickname}さん</h1>
      <button onClick={signOut}>ログアウト</button>
    </div>
  )
}
```

### Server Component での使用

```tsx
import { requireAuth } from '@/lib/auth/server-helpers'

export default async function ProtectedPage() {
  // 認証チェック + プロフィール取得を一度に実行
  const { user, profile, error } = await requireAuth()
  
  if (error || !profile) {
    return <div>エラーが発生しました</div>
  }
  
  return (
    <div>
      <h1>プロフィール: {profile.nickname}</h1>
    </div>
  )
}
```

## フック一覧

### `useAuth()`
- **用途**: 認証状態の管理
- **返り値**:
  - `user`: Supabaseのユーザーオブジェクト
  - `loading`: 認証状態の読み込み中フラグ
  - `signOut()`: ログアウト関数
  - `refreshSession()`: セッション更新関数

### `useCurrentUser()`
- **用途**: APIから現在のユーザープロフィールを取得
- **返り値**:
  - `user`: プロフィール情報
  - `isLoading`: 読み込み中フラグ
  - `error`: エラー情報
  - `refetch()`: 再取得関数
  - `metadata`: APIレスポンスのメタデータ

### `useAuthToken()`
- **用途**: アクセストークンの取得
- **返り値**:
  - `token`: JWTアクセストークン
  - `loading`: 読み込み中フラグ

### `useRequireAuth()`
- **用途**: 認証必須ページで使用するフック
- **返り値**:
  - `isAuthenticated`: 認証済みかどうか
  - `isLoading`: 読み込み中フラグ
  - `user`: Supabaseユーザー
  - `profile`: プロフィール情報

## Server Component ヘルパー

### `getAuthenticatedUser()`
- 認証済みユーザーを取得
- 未認証の場合は自動的にサインインページへリダイレクト

### `getAuthenticatedApiClient()`
- 認証トークン付きのAPIクライアントを作成

### `requireAuth()`
- 認証チェックとプロフィール取得を一度に実行
- エラーハンドリング付き

## 注意事項

- Client Componentでは必ず`'use client'`ディレクティブを使用
- Server Componentでは非同期関数として実装
- エラーハンドリングを適切に実装
- 読み込み状態を適切に表示