import { redirect } from 'next/navigation'
import { requireAuth } from '@/features/auth/server/auth-server'
import { getDictionary, type PageLang } from '@/features/i18n'
import MainNav from './main-nav'

export default async function MainLayout({
  children,
  params,
}: PageLang & { children: React.ReactNode }) {
  const { profile, error } = await requireAuth()
  const { lang } = await params
  const dict = await getDictionary(lang)

  if (error || !profile) {
    redirect(`/${lang}/signin`)
  }

  return (
    <div className="min-h-screen bg-background">
      <MainNav dict={dict} lang={lang} />
      <main>{children}</main>
    </div>
  )
}
