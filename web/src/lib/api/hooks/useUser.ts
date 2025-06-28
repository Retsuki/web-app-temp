import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../client'
import { createAuthenticatedClient } from '../client-with-auth'

// 自分のプロフィール取得用フック（認証付き）
export const useMyProfile = () => {
  return useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      const client = createAuthenticatedClient()
      const { data, error } = await client.GET('/api/v1/users/me')
      if (error) throw error
      return data
    },
  })
}

// ユーザー取得用フック
export const useUser = (userId: string) => {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/users/{id}', {
        params: { path: { id: userId } },
      })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

// ユーザー一覧取得用フック
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await apiClient.GET('/api/v1/users')
      if (error) throw error
      return data
    },
  })
}

// ユーザー更新用フック（認証付き）
export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nickname?: string; email?: string }) => {
      const client = createAuthenticatedClient()
      const { data: result, error } = await client.PUT('/api/v1/users/{id}', {
        params: { path: { id } },
        body: data,
      })
      if (error) throw error
      return result
    },
    onSuccess: (data, variables) => {
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}