'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export function LanguageSwitcher() {
  const pathname = usePathname()
  const segments = pathname.split('/')
  const currentLang = segments[1]
  
  // Replace the language segment in the path
  const getLocalizedPath = (locale: string) => {
    const newSegments = [...segments]
    newSegments[1] = locale
    return newSegments.join('/')
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={getLocalizedPath('ja')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentLang === 'ja'
            ? 'bg-gray-900 text-white'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        日本語
      </Link>
      <Link
        href={getLocalizedPath('en')}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
          currentLang === 'en'
            ? 'bg-gray-900 text-white'
            : 'text-gray-700 hover:bg-gray-200'
        }`}
      >
        English
      </Link>
    </div>
  )
}