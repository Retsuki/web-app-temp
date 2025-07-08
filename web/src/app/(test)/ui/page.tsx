'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { OutlineButton } from '@/components/app/button/outline-button'
import { PrimaryButton } from '@/components/app/button/primary-button'
import { FormCheckbox } from '@/components/app/checkbox/form-checkbox'
import { FormInput } from '@/components/app/input/form-input'
import { FormRadioGroup } from '@/components/app/radio/form-radio-group'
import { Form } from '@/components/ui/form'

const formSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
  plan: z.string().min(1, 'プランを選択してください'),
  orientation: z.string().optional(),
  terms: z.boolean().default(false),
  newsletter: z.boolean().default(false),
  notifications: z.boolean().default(false),
})

export default function UIComponentsPage() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      plan: '',
      orientation: 'vertical',
      terms: false,
      newsletter: false,
      notifications: false,
    },
  })

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          UIコンポーネント一覧
        </h1>

        {/* ボタンコンポーネント */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">ボタン</h2>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
            {/* Primaryボタン */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                Primary Button
              </h3>
              <div className="flex gap-4 items-center flex-wrap">
                <PrimaryButton>デフォルト</PrimaryButton>
                <PrimaryButton size="sm">小サイズ</PrimaryButton>
                <PrimaryButton size="lg">大サイズ</PrimaryButton>
                <PrimaryButton disabled>無効</PrimaryButton>
              </div>
            </div>

            {/* Outlineボタン */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                Outline Button
              </h3>
              <div className="flex gap-4 items-center flex-wrap">
                <OutlineButton>デフォルト</OutlineButton>
                <OutlineButton size="sm">小サイズ</OutlineButton>
                <OutlineButton size="lg">大サイズ</OutlineButton>
                <OutlineButton disabled>無効</OutlineButton>
              </div>
            </div>
          </div>
        </section>

        {/* 入力コンポーネント */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            入力フォーム
          </h2>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 space-y-6">
            {/* FormInput */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                Form Input (React Hook Form対応)
              </h3>
              <Form {...form}>
                <form className="max-w-md space-y-4">
                  <FormInput
                    control={form.control}
                    name="email"
                    label="メールアドレス"
                    type="email"
                    placeholder="example@email.com"
                  />
                  <FormInput
                    control={form.control}
                    name="password"
                    label="パスワード"
                    type="password"
                    placeholder="••••••••"
                  />
                </form>
              </Form>
            </div>

            {/* FormRadioGroup */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                Form Radio Group (React Hook Form対応)
              </h3>
              <Form {...form}>
                <form className="max-w-md space-y-6">
                  <FormRadioGroup
                    control={form.control}
                    name="plan"
                    label="料金プラン"
                    description="ご利用になるプランを選択してください"
                    options={[
                      {
                        value: 'free',
                        label: '無料プラン',
                        description: '基本機能のみ利用可能',
                      },
                      {
                        value: 'pro',
                        label: 'プロプラン',
                        description: '月額 ¥1,000',
                      },
                      {
                        value: 'enterprise',
                        label: 'エンタープライズ',
                        description: 'カスタム料金',
                      },
                    ]}
                  />

                  <FormRadioGroup
                    control={form.control}
                    name="orientation"
                    label="表示方向（横配置）"
                    orientation="horizontal"
                    options={[
                      { value: 'vertical', label: '縦' },
                      { value: 'horizontal', label: '横' },
                    ]}
                  />
                </form>
              </Form>
            </div>

            {/* FormCheckbox */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-700 dark:text-gray-300">
                Form Checkbox (React Hook Form対応)
              </h3>
              <Form {...form}>
                <form className="max-w-md space-y-4">
                  <FormCheckbox
                    control={form.control}
                    name="terms"
                    label="利用規約に同意する"
                    description="サービスの利用規約とプライバシーポリシーに同意します"
                  />

                  <FormCheckbox
                    control={form.control}
                    name="newsletter"
                    label="ニュースレターを受け取る"
                  />
                </form>
              </Form>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
