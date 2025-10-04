import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const locales = ['ja', 'en']
const defaultLocale = 'ja'

function getLocale(request: NextRequest): string {
  // Accept-Languageヘッダーを取得
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => {
    negotiatorHeaders[key] = value
  })

  // ヘッダーから言語配列を作成
  let languages: string[]
  try {
    languages = new Negotiator({ headers: negotiatorHeaders }).languages()
  } catch {
    // エラーが発生した場合はデフォルトロケールを返す
    return defaultLocale
  }

  // サポートされているロケールとマッチング
  try {
    const locale = match(languages, locales, defaultLocale)
    return locale
  } catch {
    // マッチングに失敗した場合はデフォルトロケールを返す
    return defaultLocale
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // APIプロキシパスは言語リダイレクトをスキップ
  if (pathname.startsWith('/api/')) {
    return await updateSession(request, NextResponse.next())
  }

  // パス名にサポートされているロケールが含まれているかチェック
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // パス名にロケールが既に含まれている場合は、セッション更新のみ実行
  if (pathnameHasLocale) {
    return await updateSession(request, NextResponse.next())
  }

  // ロケールがない場合はリダイレクト
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`

  // リダイレクトレスポンスを作成してセッションを更新
  const response = NextResponse.redirect(request.nextUrl)
  return await updateSession(request, response)
}

export const config = {
  matcher: [
    /*
     * 以下を除くすべてのリクエストパスにマッチ:
     * - _next/static (静的ファイル)
     * - _next/image (画像最適化ファイル)
     * - favicon.ico (ファビコンファイル)
     * - 画像ファイル - .svg, .png, .jpg, .jpeg, .gif, .webp
     * 必要に応じてこのパターンを変更してください。
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
