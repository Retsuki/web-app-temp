import { apiClient, createAuthenticatedClient } from './client'
import type { components } from './schema'

export type Plan = components['schemas']['Plan']
export type Subscription = components['schemas']['SubscriptionResponse']
export type PaymentHistory = components['schemas']['PaymentHistoryItem']
export type CheckoutSession = components['schemas']['CheckoutSessionResponse']

// Get available plans (public endpoint)
export async function getPlans() {
  const { data, error } = await apiClient.GET('/api/v1/plans')
  if (error) {
    throw error
  }
  return data
}

// Get current user's subscription
export async function getSubscription() {
  const client = createAuthenticatedClient()
  const { data, error } = await client.GET('/api/v1/billing/subscription')
  if (error) {
    throw error
  }
  return data
}

// Create checkout session
export async function createCheckoutSession(params: {
  planId: 'indie' | 'pro'
  billingCycle: 'monthly' | 'yearly'
}) {
  const client = createAuthenticatedClient()
  const { data, error } = await client.POST('/api/v1/billing/checkout', {
    body: params,
  })
  if (error) {
    throw error
  }
  return data
}

// Update subscription (change plan)
export async function updateSubscription(params: {
  planId: 'indie' | 'pro'
  billingCycle: 'monthly' | 'yearly'
}) {
  const client = createAuthenticatedClient()
  const { data, error } = await client.PATCH('/api/v1/billing/subscription', {
    body: params,
  })
  if (error) {
    throw error
  }
  return data
}

// Cancel subscription
export async function cancelSubscription() {
  const client = createAuthenticatedClient()
  const { data, error } = await client.DELETE('/api/v1/billing/subscription')
  if (error) {
    throw error
  }
  return data
}

// Get payment history
export async function getPaymentHistory(params?: { limit?: number; offset?: number }) {
  const client = createAuthenticatedClient()
  const { data, error } = await client.GET('/api/v1/billing/history', {
    params: { query: params },
  })
  if (error) {
    throw error
  }
  return data
}
