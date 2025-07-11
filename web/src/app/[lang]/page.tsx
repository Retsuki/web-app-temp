import Link from 'next/link'
import { getDictionary, LanguageSwitcher, type Locale } from '@/features/i18n'
import { createClient } from '@/lib/supabase/server'

export default async function Home({ params }: { params: Promise<{ lang: Locale }> }) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h1 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
              {dict.home.title}
            </h1>
            <p className="mt-2 text-center text-lg text-gray-600">{dict.home.description}</p>
          </div>

          <div className="mt-8 space-y-4">
            {user ? (
              <>
                <p className="text-center text-gray-600">
                  {dict.dashboard.welcome}、{user.email || ''}
                </p>
                <Link
                  href={`/${lang}/dashboard`}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {dict.common.dashboard}
                </Link>
              </>
            ) : (
              <>
                <Link
                  href={`/${lang}/signin`}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {dict.common.signIn}
                </Link>
                <Link
                  href={`/${lang}/signup`}
                  className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {dict.common.signUp}
                </Link>
              </>
            )}
          </div>

          <div className="mt-12">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">{dict.home.features.title}</h2>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                ✓ {dict.home.features.auth} - {dict.home.features.authDescription}
              </li>
              <li>
                ✓ {dict.home.features.database} - {dict.home.features.databaseDescription}
              </li>
              <li>
                ✓ {dict.home.features.ui} - {dict.home.features.uiDescription}
              </li>
              <li>
                ✓ {dict.home.features.api} - {dict.home.features.apiDescription}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
