'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LanguageSwitcher } from '@/components/app/language-switcher'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function Home() {
  const t = useTranslations()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
              {t('home.hero.title')}
            </h1>
            <p className="mt-2 text-center text-lg text-gray-600">
              {t('home.hero.subtitle')}
            </p>
          </div>
          
          <div className="mt-8 space-y-4">
            {loading ? (
              <p className="text-center text-gray-600">{t('common.loading')}</p>
            ) : user ? (
              <>
                <p className="text-center text-gray-600">
                  {t('dashboard.welcome', { name: user.email })}
                </p>
                <Link
                  href="/dashboard"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {t('navigation.dashboard')}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {t('common.signIn')}
                </Link>
                <Link
                  href="/signup"
                  className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {t('common.signUp')}
                </Link>
              </>
            )}
          </div>

          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('home.features.title')}</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>✓ {t('home.features.auth.title')} - {t('home.features.auth.description')}</li>
              <li>✓ {t('home.features.database.title')} - {t('home.features.database.description')}</li>
              <li>✓ {t('home.features.ui.title')} - {t('home.features.ui.description')}</li>
              <li>✓ {t('home.features.api.title')} - {t('home.features.api.description')}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}