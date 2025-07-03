import { getDictionary, type PageLang } from '../../dictionaries'
import BillingContent from './billing-content'

export default async function BillingPage({ params }: PageLang) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">{dict.billing.title}</h1>
        <BillingContent dict={dict} />
      </div>
    </div>
  )
}
