'use client'

import type { User } from '@supabase/supabase-js'
import { useEffect, useState } from 'react'
import { LanguageSwitcher } from '@/components/app/language-switcher'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
              高速アプリ開発テンプレート
            </h1>
            <p className="mt-2 text-center text-lg text-gray-600">新規アプリ開発を爆速化するための基本機能を事前実装</p>
          </div>

          <div className="mt-8 space-y-4">
            {loading ? (
              <p className="text-center text-gray-600">読み込み中...</p>
            ) : user ? (
              <>
                <p className="text-center text-gray-600">
                  ようこそ、{user.email || ''}さん
                </p>
                <Link
                  href="/dashboard"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  ダッシュボード
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  サインイン
                </Link>
                <Link
                  href="/signup"
                  className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  新規登録
                </Link>
              </>
            )}
          </div>

          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">実装済みの機能</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                ✓ 認証システム - メールアドレス認証とGoogle OAuth認証
              </li>
              <li>
                ✓ データベース - Supabase連携とDrizzle ORM
              </li>
              <li>
                ✓ UIコンポーネント - shadcn/ui基盤の再利用可能なコンポーネント
              </li>
              <li>
                ✓ APIサーバー - Honoベースの型安全なAPI
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
