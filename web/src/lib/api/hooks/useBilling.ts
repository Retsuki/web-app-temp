'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import * as billing from '@/lib/api/billing'

// Query keys
const billingKeys = {
  all: ['billing'] as const,
  plans: () => [...billingKeys.all, 'plans'] as const,
  subscription: () => [...billingKeys.all, 'subscription'] as const,
  history: (params?: { limit?: number; offset?: number }) =>
    [...billingKeys.all, 'history', params] as const,
}

// Get plans
export function usePlans() {
  return useQuery({
    queryKey: billingKeys.plans(),
    queryFn: billing.getPlans,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  })
}

// Get subscription
export function useSubscription() {
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: billing.getSubscription,
  })
}

// Create checkout session
export function useCreateCheckout() {
  const router = useRouter()

  return useMutation({
    mutationFn: billing.createCheckoutSession,
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
    mutationFn: billing.updateSubscription,
    onSuccess: () => {
      // Invalidate subscription cache
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() })
    },
  })
}

// Cancel subscription
export function useCancelSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: billing.cancelSubscription,
    onSuccess: () => {
      // Invalidate subscription cache
      queryClient.invalidateQueries({ queryKey: billingKeys.subscription() })
    },
  })
}

// Get payment history
export function usePaymentHistory(params?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: billingKeys.history(params),
    queryFn: () => billing.getPaymentHistory(params),
  })
}
