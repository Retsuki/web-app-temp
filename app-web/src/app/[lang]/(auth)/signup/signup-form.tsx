'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { PrimaryButton } from '@/components/app/button/primary-button'
import { FormInput } from '@/components/app/input/form-input'
import { Form } from '@/components/ui/form'
import { signUp } from '@/features/auth/server/auth-actions'
import { type FormValues, formSchema } from './_schema'
import { useAuth } from '@/features/auth/hooks/auth-context'

export function SignUpForm({ lang = 'ja' }: { lang?: string }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { checkSession } = useAuth()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nickname: '',
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    setError(null)
    setLoading(true)

    const result = await signUp({ ...data, lang })

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      // セッションを明示的に反映してから作成されたプロジェクト詳細へ遷移
      await checkSession()
      const projectId = result.projectId
      router.push(`/${lang}/projects/${projectId}`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="space-y-4">
          <FormInput
            control={form.control}
            name="nickname"
            label="ニックネーム"
            type="text"
            placeholder="ニックネーム"
            autoComplete="nickname"
          />

          <FormInput
            control={form.control}
            name="email"
            label="メールアドレス"
            type="email"
            placeholder="メールアドレス"
            autoComplete="email"
          />

          <FormInput
            control={form.control}
            name="password"
            label="パスワード"
            type="password"
            placeholder="パスワードは6文字以上"
            autoComplete="new-password"
          />
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
        )}

        <div>
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? '読み込み中...' : '新規登録'}
          </PrimaryButton>
        </div>
      </form>
    </Form>
  )
}
