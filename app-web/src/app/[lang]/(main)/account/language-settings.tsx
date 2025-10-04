'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { Dictionary } from '@/features/i18n'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  currentLanguage: string
  dict: Dictionary
}

export default function LanguageSettings({ currentLanguage, dict }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()
  const [value, setValue] = useState(currentLanguage)

  const handleChange = async (nextLang: string) => {
    if (!nextLang || nextLang === value) return
    setValue(nextLang)

    // Persisting language to profile has been removed from API.
    // Only update the URL segment and refresh the UI language.

    // Replace first path segment ([lang]) and navigate
    startTransition(() => {
      const parts = pathname.split('/')
      if (parts.length > 1) {
        parts[1] = nextLang
      }
      const newPath = parts.join('/') || '/'
      router.replace(newPath)
      router.refresh()
    })
  }

  return (
    <div className="p-4 bg-gray-50 border rounded">
      <h2 className="text-lg font-medium text-gray-900 mb-2">{dict.dashboard.settings}</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          {dict.profile?.language || 'Language'}
        </label>
        <div className="mt-1 w-48">
          <Select value={value} onValueChange={(v) => handleChange(v)} disabled={pending}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ja">日本語</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
