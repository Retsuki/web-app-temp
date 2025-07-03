'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/contexts/auth-context'
import { createAuthenticatedClient } from '@/lib/api/client-with-auth'

export function useCurrentUser() {
  const { user, loading: authLoading } = useAuth()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['currentUser', user?.id],
    queryFn: async () => {
      const client = createAuthenticatedClient()
      const { data, error } = await client.GET('/api/v1/users/me')
      if (error) {
        throw error
      }
      return data
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    retry: 1,
  })

  return {
    user: data?.data ?? null,
    isLoading: authLoading || isLoading,
    error,
    refetch,
    metadata: data?.metadata,
  }
}

// 認証必須ページ用のフック
export function useRequireAuth() {
  const { user, loading } = useAuth()
  const { user: profile, isLoading } = useCurrentUser()

  return {
    isAuthenticated: !!user,
    isLoading: loading || isLoading,
    user,
    profile,
  }
}
