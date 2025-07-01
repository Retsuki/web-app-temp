import { notFound } from 'next/navigation'
import { getRequestConfig } from 'next-intl/server'

export const locales = ['ja', 'en'] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = 'ja'

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale)
}

export default getRequestConfig(async ({ locale }) => {
  if (!isValidLocale(locale)) {
    notFound()
  }

  return {
    messages: (await import(`./src/messages/${locale}.json`)).default,
  }
})