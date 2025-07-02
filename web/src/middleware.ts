import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { match } from '@formatjs/intl-localematcher'
import Negotiator from 'negotiator'

const locales = ['ja', 'en']
const defaultLocale = 'ja'

function getLocale(request: NextRequest): string {
  // Get Accept-Language header
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  // Create language array from headers
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages()

  // Match with supported locales
  const locale = match(languages, locales, defaultLocale)
  return locale
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if there is any supported locale in the pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  // If pathname already has locale, proceed with session update
  if (pathnameHasLocale) {
    return await updateSession(request, NextResponse.next())
  }

  // Redirect if there is no locale
  const locale = getLocale(request)
  request.nextUrl.pathname = `/${locale}${pathname}`
  
  // Create redirect response and update session
  const response = NextResponse.redirect(request.nextUrl)
  return await updateSession(request, response)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
