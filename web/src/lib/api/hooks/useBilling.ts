'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
// TODO: Uncomment when billing API is available
// import { apiClient, createAuthenticatedClient } from '../client'
import type { components } from '../schema'

export type Plan = components['schemas']['Plan']
export type Subscription = components['schemas']['SubscriptionResponse']
export type PaymentHistory = components['schemas']['PaymentHistoryItem']
export type CheckoutSession = components['schemas']['CheckoutSessionResponse']

// Get plans
export function usePlans() {
  return useQuery({
    queryKey: ['billing', 'plans'],
    queryFn: async () => {
      // TODO: Uncomment when billing API is available
      // const { data, error } = await apiClient.GET('/api/v1/plans')
      // if (error) {
      //   throw error
      // }
      // return data
      return { plans: [] } // Temporary mock data
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  })
}

// Get subscription
export function useSubscription() {
  return useQuery({
    queryKey: ['billing', 'subscription'],
    queryFn: async () => {
      // TODO: Uncomment when billing API is available
      // const client = createAuthenticatedClient()
      // const { data, error } = await client.GET('/api/v1/billing/subscription')
      // if (error) {
      //   throw error
      // }
      // return data
      return null // Temporary mock data
    },
  })
}

// Create checkout session
export function useCreateCheckout() {
  const router = useRouter()

  return useMutation({
    mutationFn: async (params: {
      planId: 'indie' | 'pro'
      billingCycle: 'monthly' | 'yearly'
    }) => {
      // TODO: Uncomment when billing API is available
      // const client = createAuthenticatedClient()
      // const { data, error } = await client.POST('/api/v1/billing/checkout', {
      //   body: params,
      // })
      // if (error) {
      //   throw error
      // }
      // return data
      return { url: '#' } // Temporary mock data
    },
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      router.push(data.url)
    },
  })
}

// Update subscription
export function useUpdateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: {
      planId: 'indie' | 'pro'
      billingCycle: 'monthly' | 'yearly'
    }) => {
      // TODO: Uncomment when billing API is available
      // const client = createAuthenticatedClient()
      // const { data, error } = await client.PATCH('/api/v1/billing/subscription', {
      //   body: params,
      // })
      // if (error) {
      //   throw error
      // }
      // return data
      return {} // Temporary mock data
    },
    onSuccess: () => {
      // Invalidate subscription cache
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] })
    },
  })
}

// Cancel subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      // TODO: Uncomment when billing API is available
      // const client = createAuthenticatedClient()
      // const { data, error } = await client.DELETE('/api/v1/billing/subscription')
      // if (error) {
      //   throw error
      // }
      // return data
      return {} // Temporary mock data
    },
    onSuccess: () => {
      // Invalidate subscription cache
      queryClient.invalidateQueries({ queryKey: ['billing', 'subscription'] })
    },
  })
}

// Get payment history
export function usePaymentHistory(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['billing', 'history', params],
    queryFn: async () => {
      // TODO: Uncomment when billing API is available
      // const client = createAuthenticatedClient()
      // const { data, error } = await client.GET('/api/v1/billing/history', {
      //   params: { query: params },
      // })
      // if (error) {
      //   throw error
      // }
      // return data
      return { items: [], total: 0 } // Temporary mock data
    },
  })
}
