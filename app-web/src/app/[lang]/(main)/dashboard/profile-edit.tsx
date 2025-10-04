'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PrimaryButton } from '@/components/app/button/primary-button'
import { FormInput } from '@/components/app/input/form-input'
import { Form } from '@/components/ui/form'
import { useGetProfile, useUpdateProfile } from '@/lib/api/generated/users/users'

const profileSchema = z.object({
  nickname: z
    .string()
    .min(1, 'ニックネームは必須です')
    .max(50, 'ニックネームは50文字以内で入力してください'),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function ProfileEdit() {
  const { data: response, isLoading, error } = useGetProfile()
  const updateUser = useUpdateProfile()
  const profile = response?.data

  const [isEditing, setIsEditing] = useState(false)

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nickname: profile?.nickname || '',
    },
  })

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-600">プロフィールの読み込みに失敗しました</div>
  }

  const onSubmit = async (data: ProfileFormData) => {
    if (!profile) {
      return
    }

    try {
      await updateUser.mutateAsync({
        data: {
          nickname: data.nickname,
        },
      })
      setIsEditing(false)
    } catch (error) {
      console.error('更新エラー:', error)
    }
  }

  const handleCancel = () => {
    form.reset({ nickname: profile?.nickname || '' })
    setIsEditing(false)
  }

  if (!isEditing) {
    return (
      <div className="mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-2">
          プロフィール編集（Client Component）
        </h2>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-500">ニックネーム</p>
            <p className="text-lg font-medium">{profile?.nickname}</p>
          </div>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          ※ React Query + openapi-fetchを使用したClient Componentの例
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-2">
        プロフィール編集（Client Component）
      </h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormInput control={form.control} name="nickname" label="ニックネーム" type="text" />

          <div className="flex gap-2">
            <PrimaryButton type="submit" disabled={updateUser.isPending}>
              {updateUser.isPending ? '更新中...' : '保存'}
            </PrimaryButton>

            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={updateUser.isPending}
            >
              キャンセル
            </button>
          </div>

          {updateUser.isError && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded">更新に失敗しました</div>
          )}

          {updateUser.isSuccess && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded">
              プロフィールを更新しました
            </div>
          )}
        </form>
      </Form>
    </div>
  )
}
