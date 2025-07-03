import 'server-only'

export type Locale = 'ja' | 'en'

const dictionaries = {
  ja: () => import('../dictionaries/ja.json').then((module) => module.default),
  en: () => import('../dictionaries/en.json').then((module) => module.default),
}

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]?.() ?? dictionaries.ja()
}

// Type for dictionary
export type Dictionary = Awaited<ReturnType<typeof getDictionary>>
export type PageLang = {
  params: Promise<{
    lang: Locale
  }>
}
