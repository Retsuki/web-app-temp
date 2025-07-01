'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { type Locale, locales } from '../../../i18n'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const handleLocaleChange = (newLocale: Locale) => {
    // Remove the current locale from the pathname
    const segments = pathname.split('/')
    const currentLocaleIndex = segments.findIndex((segment) => locales.includes(segment as Locale))

    if (currentLocaleIndex !== -1) {
      segments[currentLocaleIndex] = newLocale
    } else {
      // If no locale in path, add it at the beginning
      segments.splice(1, 0, newLocale)
    }

    const newPath = segments.join('/')
    router.push(newPath)
  }

  return (
    <div className="flex gap-2">
      {locales.map((loc) => (
        <Button
          key={loc}
          variant={locale === loc ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLocaleChange(loc)}
        >
          {loc.toUpperCase()}
        </Button>
      ))}
    </div>
  )
}
