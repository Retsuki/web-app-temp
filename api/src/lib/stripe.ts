import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set')
}

// サイトURLの検証
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
  throw new Error('NEXT_PUBLIC_SITE_URL must include a valid scheme (http:// or https://)')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-02-24.acacia',
  typescript: true,
})

// Stripe関連の定数
export const STRIPE_CONFIG = {
  // Webhook署名シークレット
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,

  // Price IDs
  priceIds: {
    indie: {
      monthly: process.env.STRIPE_PRICE_ID_INDIE_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_ID_INDIE_YEARLY!,
    },
    pro: {
      monthly: process.env.STRIPE_PRICE_ID_PRO_MONTHLY!,
      yearly: process.env.STRIPE_PRICE_ID_PRO_YEARLY!,
    },
  },

  // URLs
  urls: {
    success: `${siteUrl}/{locale}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel: `${siteUrl}/{locale}/billing/cancel`,
    portal: `${siteUrl}/{locale}/billing`,
  },
} as const
