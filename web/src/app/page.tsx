import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
            Welcome to Template App
          </h1>
          <p className="mt-2 text-center text-lg text-gray-600">
            新規アプリ開発を爆速化するテンプレート
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          {user ? (
            <>
              <p className="text-center text-gray-600">
                ログイン済みです
              </p>
              <Link
                href="/dashboard"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ダッシュボードへ
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                ログイン
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">実装済み機能</h2>
          <ul className="space-y-2 text-sm text-gray-600">
            <li>✓ 認証システム（サインアップ・サインイン）</li>
            <li>✓ ユーザープロフィール管理</li>
            <li>✓ Supabase連携</li>
            <li className="text-gray-400">○ 決済機能（準備中）</li>
            <li className="text-gray-400">○ API連携基盤（準備中）</li>
          </ul>
        </div>
      </div>
    </div>
  )
}