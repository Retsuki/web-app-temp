import { SignOutButton } from '@/features/auth/components/sign-out-button'
import { requireAuth } from '@/features/auth/server/auth-server'
import { getDictionary, type PageLang } from '@/features/i18n'
import BillingStatus from './billing-status'
import LanguageSettings from './language-settings'

export default async function AccountPage({ params }: PageLang) {
  const { lang } = await params
  const dict = await getDictionary(lang)
  const { profile, error } = await requireAuth()

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Account</h1>

              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                <p className="text-sm font-medium">{dict.errors.internalError}</p>
                <p className="text-xs mt-1">{dict.errors.tryAgainLater}</p>
              </div>

              <SignOutButton label={dict.common.signOut} variant="destructive" size="sm" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  const p = profile.data

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Account</h1>

            <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">ID</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{p.userId}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">{dict.common.email}</dt>
                <dd className="mt-1 text-sm text-gray-900">{p.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">{dict.profile?.nickname || 'Nickname'}</dt>
                <dd className="mt-1 text-sm text-gray-900">{p.nickname}</dd>
              </div>
              {/* Language is no longer part of UserProfile */}
              <div>
                <dt className="text-sm font-medium text-gray-500">Created</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(p.createdAt).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Updated</dt>
                <dd className="mt-1 text-sm text-gray-900">{new Date(p.updatedAt).toLocaleString()}</dd>
              </div>
            </div>

            <div className="mt-8">
              <LanguageSettings currentLanguage={lang} dict={dict} />
            </div>

            <div className="mt-8">
              <BillingStatus dict={dict} />
            </div>

            <div className="mt-8">
              <SignOutButton label={dict.common.signOut} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
