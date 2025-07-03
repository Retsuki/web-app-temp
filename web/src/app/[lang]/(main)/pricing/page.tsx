import { getDictionary, type PageLang } from '../../dictionaries'
import PricingContent from './pricing-content'

export default async function PricingPage({ params }: PageLang) {
  const { lang } = await params
  const dict = await getDictionary(lang)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">{dict.pricing.title}</h1>
          <p className="text-xl text-muted-foreground">{dict.pricing.subtitle}</p>
        </div>
        <PricingContent dict={dict} />
      </div>
    </div>
  )
}
