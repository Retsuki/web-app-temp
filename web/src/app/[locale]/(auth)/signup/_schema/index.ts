import { z } from 'zod'

export const getFormSchema = (t: any) => z.object({
  nickname: z
    .string()
    .min(2, t('validation.minLength', { field: t('common.nickname'), min: 2 }))
    .max(50, t('validation.maxLength', { field: t('common.nickname'), max: 50 })),
  email: z
    .string()
    .email(t('validation.email')),
  password: z
    .string()
    .min(6, t('validation.minLength', { field: t('common.password'), min: 6 }))
    .max(100, t('validation.maxLength', { field: t('common.password'), max: 100 })),
})

export const formSchema = getFormSchema((key: string) => key) // Temporary for type inference
export type FormValues = z.infer<typeof formSchema>