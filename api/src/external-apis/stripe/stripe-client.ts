import Stripe from 'stripe'

export type BillingCycle = 'monthly' | 'yearly'
export type PlanId = 'free' | 'starter' | 'pro'
export type AppEnvType = 'dev' | 'prod'
export type Booleanish = boolean | 'true' | 'false'

export type StripeProductMetadata = {
  planId?: Exclude<PlanId, 'free'>
  public?: Booleanish
  sortOrder?: number | string
  env?: AppEnvType
}

export type StripePriceMetadata = {
  planId?: Exclude<PlanId, 'free'>
  billingCycle?: BillingCycle
  version?: string
  current?: Booleanish
  env?: AppEnvType
}

export function parseBooleanish(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  const v = String(value ?? '').trim().toLowerCase()
  return v === 'true'
}

export class StripeClient {
  private readonly _api: Stripe

  constructor(secretKey?: string) {
    const key = secretKey || process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY is not set')
    this._api = new Stripe(key, { apiVersion: '2025-08-27.basil', typescript: true })
  }

  get api(): Stripe {
    return this._api
  }

  constructEvent(body: string | Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || ''
    return this._api.webhooks.constructEvent(body, signature, secret)
  }
}

let singletonClient: StripeClient | null = null
export function getStripeClient(): StripeClient {
  if (!singletonClient) singletonClient = new StripeClient()
  return singletonClient
}

