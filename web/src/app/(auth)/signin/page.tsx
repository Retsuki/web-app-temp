'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from '@/lib/auth/actions'
import Link from 'next/link'
import { Form } from '@/components/ui/form'
import { FormInput } from '@/components/app/input'
import { PrimaryButton } from '@/components/app/button'
import { GoogleAuthForm } from '@/components/app/auth/google-auth-form'

const formSchema = z.object({
  email: z
    .string()
    .email('有効なメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください'),
})

type FormValues = z.infer<typeof formSchema>

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    setError(null)
    setLoading(true)

    const result = await signIn(data)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            ログイン
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            または{' '}
            <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              新しいアカウントを作成
            </Link>
          </p>
        </div>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
            <div className="space-y-4">
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
                placeholder="パスワード"
                autoComplete="current-password"
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
              <PrimaryButton
                type="submit"
                disabled={loading}
                className="w-full"
              >
                {loading ? 'ログイン中...' : 'ログイン'}
              </PrimaryButton>
            </div>
          </form>
        </Form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-gray-50 px-2 text-gray-500">または</span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleAuthForm>
              Googleでログイン
            </GoogleAuthForm>
          </div>
        </div>
      </div>
    </div>
  )
}