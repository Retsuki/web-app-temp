import Stripe from 'stripe'

// Lazy initialization to ensure environment variables are loaded
let stripeInstance: Stripe | null = null

export const getStripe = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    })
  }
  return stripeInstance
}

// For backward compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop, receiver) {
    return Reflect.get(getStripe(), prop, receiver)
  },
})

// Stripe関連の定数 - Lazy evaluation to ensure environment variables are loaded
export const STRIPE_CONFIG = {
  // Webhook署名シークレット
  get webhookSecret() {
    return process.env.STRIPE_WEBHOOK_SECRET || ''
  },

  // Price IDs (not used; kept for compatibility)
  priceIds: {
    starter: {
      get monthly() {
        return process.env.STRIPE_PRICE_ID_STARTER_MONTHLY || ''
      },
      get yearly() {
        return process.env.STRIPE_PRICE_ID_STARTER_YEARLY || ''
      },
    },
    pro: {
      get monthly() {
        return process.env.STRIPE_PRICE_ID_PRO_MONTHLY || ''
      },
      get yearly() {
        return process.env.STRIPE_PRICE_ID_PRO_YEARLY || ''
      },
    },
  },

  // URLs
  urls: {
    get success() {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      // zubora準拠: 成功時は設定アカウント画面へ
      return `${siteUrl}/{locale}/settings/account?session_id={CHECKOUT_SESSION_ID}`
    },
    get cancel() {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      // zubora準拠: キャンセルは設定トップへ
      return `${siteUrl}/{locale}/settings`
    },
    get portal() {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
      return `${siteUrl}/{locale}/billing`
    },
  },
} as const
