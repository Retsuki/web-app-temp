'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslations } from 'next-intl'
import { signIn } from '@/lib/auth/actions'
import { Form } from '@/components/ui/form'
import { FormInput } from '@/components/app/input/form-input'
import { PrimaryButton } from '@/components/app/button/primary-button'

const getFormSchema = (t: any) => z.object({
  email: z
    .string()
    .email(t('validation.email')),
  password: z
    .string()
    .min(1, t('validation.required', { field: t('common.password') })),
})

type FormValues = z.infer<typeof formSchema>

export function SignInForm() {
  const t = useTranslations()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const formSchema = getFormSchema(t)
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
            label={t('auth.emailLabel')}
            type="email"
            placeholder={t('auth.emailLabel')}
            autoComplete="email"
          />
          
          <FormInput
            control={form.control}
            name="password"
            label={t('auth.passwordLabel')}
            type="password"
            placeholder={t('auth.passwordLabel')}
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
            {loading ? t('common.loading') : t('auth.signInButton')}
          </PrimaryButton>
        </div>
      </form>
    </Form>
  )
}