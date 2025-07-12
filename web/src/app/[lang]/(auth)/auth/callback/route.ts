import { NextResponse } from 'next/server'
import { postApiV1UsersServer } from '@/lib/api/server-api'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  // 環境変数から正しいURLを取得、なければリクエストのoriginを使用
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

  // パスから言語を取得
  const pathParts = requestUrl.pathname.split('/')
  const lang = pathParts[1] || 'ja' // デフォルトは'ja'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Google認証成功後、プロフィールが存在しない場合は作成
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        try {
          // APIを使用してユーザープロフィールを作成
          // サーバーサイド用のAPIクライアントを使用（自動的に認証ヘッダーが付与される）
          await postApiV1UsersServer({
            userId: user.id,
            email: user.email || '',
            nickname: user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
          })
        } catch (error) {
          // ユーザーが既に存在する場合はエラーを無視
          console.log('User profile creation skipped:', error)
        }
      }

      return NextResponse.redirect(`${siteUrl}/${lang}/dashboard`)
    }
  }

  // エラーの場合はサインインページへリダイレクト
  return NextResponse.redirect(`${siteUrl}/${lang}/signin?error=auth_failed`)
}
