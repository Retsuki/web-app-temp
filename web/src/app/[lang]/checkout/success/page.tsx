import { CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getDictionary, type PageLang } from '../../dictionaries'

export default async function CheckoutSuccessPage({ params }: PageLang) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-4">
          {dict.checkout?.successTitle || 'Payment Successful!'}
        </h1>
        <p className="text-muted-foreground mb-8">
          {dict.checkout?.successMessage ||
            'Your subscription has been activated. Thank you for your purchase!'}
        </p>
        <div className="space-y-2">
          <Link href={`/${lang}/billing`}>
            <Button className="w-full">{dict.billing.title}</Button>
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
