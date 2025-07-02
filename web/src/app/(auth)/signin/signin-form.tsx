'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { signIn } from '@/lib/auth/actions'
import { Form } from '@/components/ui/form'
import { FormInput } from '@/components/app/input/form-input'
import { PrimaryButton } from '@/components/app/button/primary-button'

const formSchema = z.object({
  email: z
    .string()
    .email('正しいメールアドレスを入力してください'),
  password: z
    .string()
    .min(1, 'パスワードを入力してください'),
})

type FormValues = z.infer<typeof formSchema>

export function SignInForm() {
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
            {loading ? '読み込み中...' : 'サインイン'}
          </PrimaryButton>
        </div>
      </form>
    </Form>
  )
}