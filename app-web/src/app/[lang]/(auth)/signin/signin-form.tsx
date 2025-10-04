'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { PrimaryButton } from '@/components/app/button/primary-button'
import { FormInput } from '@/components/app/input/form-input'
import { Form } from '@/components/ui/form'
import { signIn } from '@/features/auth/server/auth-actions'
import { useAuth } from '@/features/auth/hooks/auth-context'
import type { Dictionary } from '@/features/i18n'

interface SignInFormProps {
  dict: Dictionary
  lang?: string
}

export function SignInForm({ dict, lang = 'ja' }: SignInFormProps) {
  const formSchema = z.object({
    email: z.string().email(dict.auth.invalidEmail),
    password: z.string().min(1, dict.auth.password),
  })

  type FormValues = z.infer<typeof formSchema>
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { checkSession } = useAuth()

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

    if (result && 'error' in result && result.error) {
      setError(result.error)
      setLoading(false)
    } else if (result?.success) {
      // セッションを明示的に反映し、一覧ページへ遷移
      await checkSession()
      router.push(`/${lang}/projects`)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="space-y-4">
          <FormInput
            control={form.control}
            name="email"
            label={dict.auth.email}
            type="email"
            placeholder={dict.auth.email}
            autoComplete="email"
          />

          <FormInput
            control={form.control}
            name="password"
            label={dict.auth.password}
            type="password"
            placeholder={dict.auth.password}
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
          <PrimaryButton type="submit" disabled={loading} className="w-full">
            {loading ? dict.common.loading : dict.common.signIn}
          </PrimaryButton>
        </div>
      </form>
    </Form>
  )
}
