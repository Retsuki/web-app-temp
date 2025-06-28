import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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


// プロフィール更新用フック（認証付き）
export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { nickname?: string }) => {
      const client = createAuthenticatedClient()
      const { data: result, error } = await client.PUT('/api/v1/users/me', {
        body: data,
      })
      if (error) throw error
      return result
    },
    onSuccess: () => {
      // キャッシュを更新
      queryClient.invalidateQueries({ queryKey: ['user', 'me'] })
    },
  })
}