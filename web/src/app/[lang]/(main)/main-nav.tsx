'use client'

import { CreditCardIcon, DollarSignIcon, FolderIcon, HomeIcon, LogOutIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { signOut } from '@/features/auth/server/auth-actions'
import type { Dictionary } from '@/features/i18n'
import { cn } from '@/lib/utils'

interface MainNavProps {
  dict: Dictionary
  lang: string
}

export default function MainNav({ dict, lang }: MainNavProps) {
  const pathname = usePathname()

  const navigation = [
    { name: dict.common.dashboard, href: `/${lang}/dashboard`, icon: HomeIcon },
    { name: 'プロジェクト', href: `/${lang}/projects`, icon: FolderIcon },
    { name: dict.pricing.title, href: `/${lang}/pricing`, icon: DollarSignIcon },
    { name: dict.billing.title, href: `/${lang}/billing`, icon: CreditCardIcon },
  ]

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href={`/${lang}/dashboard`} className="text-xl font-bold text-primary">
                Web App
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium',
                      isActive
                        ? 'border-primary text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    )}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center">
            <form action={signOut}>
              <Button variant="ghost" size="sm" type="submit">
                <LogOutIcon className="h-4 w-4 mr-2" />
                {dict.common.signOut}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
}
