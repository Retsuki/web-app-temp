import { XCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDictionary, type PageLang } from '@/features/i18n'

export default async function CheckoutCancelPage({ params }: PageLang) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">
          {dict.checkout?.cancelTitle || 'Payment Cancelled'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {dict.checkout?.cancelMessage ||
            'Your payment was cancelled. No charges were made to your account.'}
        </p>
        <div className="space-y-2">
          <Link href={`/${lang}/pricing`}>
            <Button className="w-full">{dict.pricing.title}</Button>
          </Link>
          <Link href={`/${lang}/dashboard`}>
            <Button variant="outline" className="w-full">
              {dict.common.dashboard}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
