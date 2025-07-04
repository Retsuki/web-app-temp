# APIクライアント設計ガイド

## 概要

本ドキュメントでは、OpenAPIスキーマからTypeScript APIクライアントを自動生成する方法について説明します。
現在のopenapi-fetchベースの実装から、より効率的なOrvalへの移行を提案します。

## 現状の課題

### openapi-fetchの問題点

1. **手動でのTanStack Query統合**
   - 各エンドポイントごとにカスタムフックを手動で作成する必要がある
   - ボイラープレートコードが増える
   - 型安全性は保たれるが、開発効率が低下

2. **コード例**
   ```typescript
   // 現在の実装：手動でカスタムフックを作成
   export const useGetUser = (userId: string) => {
     return useQuery({
       queryKey: ['user', userId],
       queryFn: async () => {
         const client = await createAuthenticatedClient();
         const { data, error } = await client.GET('/api/v1/users/{userId}', {
           params: { path: { userId } }
         });
         if (error) throw error;
         return data;
       }
     });
   };
   ```

3. **メンテナンス性**
   - エンドポイントが増えるたびに同様のコードを書く必要がある
   - エラーハンドリングやオプション設定の一貫性を保つのが困難

## Orvalの導入

### Orvalとは

Orvalは、OpenAPIスキーマから以下を自動生成するツールです：
- TypeScript型定義
- APIクライアント関数
- TanStack Query/SWR対応のカスタムフック
- MSW (Mock Service Worker) モック

### 主なメリット

1. **完全自動生成**
   - TanStack Queryのカスタムフックを自動生成
   - queryKey、mutationの設定も含めて生成
   - 型安全性を保ちながらボイラープレートを削減

2. **生成されるコード例**
   ```typescript
   // Orvalが自動生成するカスタムフック
   export const useGetUser = (
     userId: string,
     options?: UseQueryOptions<User, Error>
   ) => {
     return useQuery<User, Error>({
       queryKey: getGetUserQueryKey(userId),
       queryFn: () => getUser(userId),
       ...options
     });
   };
   
   // mutationも自動生成
   export const useUpdateUser = (
     options?: UseMutationOptions<User, Error, UpdateUserParams>
   ) => {
     return useMutation<User, Error, UpdateUserParams>({
       mutationFn: (params) => updateUser(params.userId, params.data),
       ...options
     });
   };
   ```

3. **高度なカスタマイズ性**
   - カスタムインスタンス（認証ヘッダー等）の注入
   - queryKeyの生成ロジックのカスタマイズ
   - エラーハンドリングの統一

## 設定方法

### 1. インストール

```bash
cd web
npm install --save-dev orval
```

### 2. 設定ファイル (orval.config.ts)

```typescript
import { defineConfig } from 'orval';

export default defineConfig({
  api: {
    input: {
      target: '../api/openapi.json', // OpenAPIスキーマのパス
    },
    output: {
      mode: 'tags-split', // タグごとにファイルを分割
      target: './src/lib/api/generated',
      schemas: './src/lib/api/generated/schemas',
      client: 'react-query', // TanStack Query v5対応
      mock: true, // MSWモックも生成
      override: {
        mutator: {
          path: './src/lib/api/client.ts', // カスタムクライアント
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
          signal: true, // AbortSignal対応
          options: {
            staleTime: 60 * 1000, // デフォルトのstaleTime
          },
        },
      },
    },
    hooks: {
      afterAllFilesWrite: 'prettier --write', // 生成後のフォーマット
    },
  },
});
```

### 3. カスタムクライアント (client.ts)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const customInstance = async <T>({
  url,
  method,
  params,
  data,
  headers,
  signal,
}: {
  url: string;
  method: string;
  params?: any;
  data?: any;
  headers?: any;
  signal?: AbortSignal;
}): Promise<T> => {
  const session = await supabase.auth.getSession();
  const token = session.data.session?.access_token;

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    ...(data && { body: JSON.stringify(data) }),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};
```

### 4. package.jsonスクリプト

```json
{
  "scripts": {
    "gen:api": "orval --config ./orval.config.ts",
    "gen:api:watch": "orval --config ./orval.config.ts --watch"
  }
}
```

## 使用例

### 生成されたフックの使用

```typescript
import { useGetUser, useUpdateUser } from '@/lib/api/generated/users';

export function UserProfile({ userId }: { userId: string }) {
  // データ取得
  const { data: user, isLoading, error } = useGetUser(userId);
  
  // データ更新
  const updateUserMutation = useUpdateUser({
    onSuccess: (data) => {
      console.log('User updated:', data);
    },
    onError: (error) => {
      console.error('Update failed:', error);
    },
  });

  const handleUpdate = (updates: UserUpdateData) => {
    updateUserMutation.mutate({
      userId,
      data: updates,
    });
  };

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      {/* ... */}
    </div>
  );
}
```

### queryKeyの活用

```typescript
import { getGetUserQueryKey } from '@/lib/api/generated/users';
import { useQueryClient } from '@tanstack/react-query';

export function useInvalidateUser(userId: string) {
  const queryClient = useQueryClient();
  
  return () => {
    // 特定のユーザーデータを無効化
    queryClient.invalidateQueries({
      queryKey: getGetUserQueryKey(userId),
    });
  };
}
```

## マイグレーション手順

### 1. 段階的移行

1. **Phase 1**: Orvalセットアップ
   - Orvalのインストールと設定
   - 最初のエンドポイントで動作確認

2. **Phase 2**: 新規エンドポイント
   - 新しく追加するエンドポイントからOrval生成のコードを使用
   - 既存のopenapi-fetchコードと共存

3. **Phase 3**: 既存コードの移行
   - 優先度の高いエンドポイントから順次移行
   - テストを実行しながら段階的に置き換え

4. **Phase 4**: クリーンアップ
   - openapi-fetchの削除
   - 手動で作成したカスタムフックの削除

### 2. 移行チェックリスト

- [ ] Orvalのインストールと設定ファイルの作成
- [ ] カスタムクライアントの実装（認証対応）
- [ ] 最初のエンドポイントで動作確認
- [ ] CI/CDパイプラインへの組み込み
- [ ] 既存のカスタムフックを段階的に置き換え
- [ ] 不要なコードの削除

## ベストプラクティス

### 1. ファイル構成

```
/web/src/lib/api/
├── generated/          # Orvalが生成するファイル（.gitignore対象）
│   ├── users/
│   ├── auth/
│   └── schemas/
├── client.ts          # カスタムクライアント
└── orval.config.ts    # Orval設定
```

### 2. 型の再利用

```typescript
// 生成された型を再利用
import type { User, UserUpdateRequest } from '@/lib/api/generated/schemas';

// コンポーネントで使用
interface UserFormProps {
  user: User;
  onUpdate: (data: UserUpdateRequest) => void;
}
```

### 3. エラーハンドリング

```typescript
// グローバルエラーハンドリング
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 60 * 1000,
    },
    mutations: {
      onError: (error) => {
        // 共通エラー処理
        console.error('API Error:', error);
      },
    },
  },
});
```

## まとめ

Orvalを導入することで：
- 開発効率の大幅な向上
- コードの一貫性と保守性の改善
- 型安全性を保ちながらボイラープレートの削減
- モックサーバーの自動生成によるテスト環境の改善

これらの利点により、より生産的な開発環境を構築できます。