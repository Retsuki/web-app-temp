import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createUserProfileAndProject } from '../../../../../features/auth/server/auth-helpers'

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
      try {
        // ユーザー情報を取得
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          return NextResponse.redirect(`${siteUrl}/${lang}/signin?error=auth_failed`)
        }

        // 共通ロジックを使用してプロフィールとプロジェクトを作成
        const result = await createUserProfileAndProject(user, undefined, lang)

        // エラーチェック
        if (!result.success && result.error) {
          return NextResponse.redirect(`${siteUrl}/${lang}/signin?error=setup_failed`)
        }

        // リダイレクト先を決定
        const redirectTo = `/${lang}/projects/${result.projectId}`
        return NextResponse.redirect(`${siteUrl}${redirectTo}`)
      } catch (error) {
        console.error('Callback processing error:', error)
        return NextResponse.redirect(`${siteUrl}/${lang}/signin?error=auth_failed`)
      }
    }
  }

  // エラーの場合はサインインページへリダイレクト
  return NextResponse.redirect(`${siteUrl}/${lang}/signin?error=auth_failed`)
}
