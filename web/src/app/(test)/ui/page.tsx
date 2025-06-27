"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OutlineButton } from "@/components/app/button/outline-button";
import { PrimaryButton } from "@/components/app/button/primary-button";
import { FormInput } from "@/components/app/input/form-input";
import { Form } from "@/components/ui/form";

const formSchema = z.object({
  email: z.string().email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export default function UIComponentsPage() {
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-white">
          UIコンポーネント一覧
        </h1>

        {/* ボタンコンポーネント */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 dark:text-gray-200">
            ボタン
          </h2>

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
          </div>
        </section>
      </div>
    </div>
  );
}
