'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useGetApiV1UsersMe, usePutApiV1UsersMe } from '@/lib/api/generated/users/users'

/**
 * Orvalが生成したAPIクライアントフックの使用例
 * TanStack Queryのフックが自動生成されており、型安全にAPIを呼び出せます
 */
export function UserProfileExample() {
  const [nickname, setNickname] = useState('')

  // プロフィール取得（自動的に認証ヘッダーが付与される）
  const { data: response, isLoading, error, refetch } = useGetApiV1UsersMe()

  const profile = response?.data

  // プロフィールデータが取得されたらnicknameを設定
  useEffect(() => {
    if (profile?.nickname) {
      setNickname(profile.nickname)
    }
  }, [profile])

  // プロフィール更新用のmutation
  const updateProfileMutation = usePutApiV1UsersMe({
    mutation: {
      onSuccess: () => {
        toast.success('プロフィールを更新しました')
        refetch() // データを再取得
      },
      onError: (error) => {
        console.error('Update failed:', error)
        toast.error('プロフィールの更新に失敗しました')
      },
    },
  })

  const handleUpdate = () => {
    if (!profile) return

    updateProfileMutation.mutate({
      data: {
        nickname,
      },
    })
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-10 bg-gray-200 rounded" />
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className="p-6">
        <p className="text-red-500">エラーが発生しました</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">プロフィール</h2>

      <div className="space-y-4">
        <div>
          <Label>ユーザーID</Label>
          <p className="text-sm text-gray-600">{profile?.userId}</p>
        </div>

        <div>
          <Label>メールアドレス</Label>
          <p className="text-sm text-gray-600">{profile?.email}</p>
        </div>

        <div>
          <Label htmlFor="nickname">ニックネーム</Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="ニックネームを入力"
          />
        </div>

        <Button onClick={handleUpdate} disabled={updateProfileMutation.isPending}>
          {updateProfileMutation.isPending ? '更新中...' : 'プロフィールを更新'}
        </Button>
      </div>
    </Card>
  )
}
