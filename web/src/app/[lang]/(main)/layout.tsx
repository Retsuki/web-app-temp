import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth/server-helpers'
import { getDictionary, type PageLang } from '../dictionaries'
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
