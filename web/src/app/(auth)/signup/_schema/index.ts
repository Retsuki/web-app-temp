import { z } from 'zod'

export const formSchema = z.object({
  nickname: z
    .string()
    .min(2, 'ニックネームは2文字以上で入力してください')
    .max(50, 'ニックネームは50文字以下で入力してください'),
  email: z
    .string()
    .email('正しいメールアドレスを入力してください'),
  password: z
    .string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .max(100, 'パスワードは100文字以下で入力してください'),
})

export type FormValues = z.infer<typeof formSchema>