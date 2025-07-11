'use client'

import { CheckIcon, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/features/auth/hooks/auth-context'
import type { Dictionary } from '@/features/i18n'
import {
  useGetApiV1BillingSubscription,
  useGetApiV1Plans,
  usePostApiV1BillingCheckout,
} from '@/lib/api/generated/billing/billing'

export default function PricingContent({ dict }: { dict: Dictionary }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const { user } = useAuth()
  const router = useRouter()

  // API hooks
  const { data: plansResponse, isLoading: plansLoading } = useGetApiV1Plans()
  const { data: subscriptionResponse } = useGetApiV1BillingSubscription()
  const createCheckout = usePostApiV1BillingCheckout()

  // Extract data from API responses
  const plans = plansResponse?.plans
  const subscription = subscriptionResponse

  const handleSelectPlan = async (planId: 'indie' | 'pro') => {
    if (!user) {
      router.push('/signin')
      return
    }

    if (subscription?.plan === planId && subscription?.billingCycle === billingCycle) {
      // Already on this plan
      return
    }

    createCheckout.mutate(
      { data: { planId, billingCycle, locale: 'ja' } },
      {
        onSuccess: (data) => {
          // Redirect to Stripe checkout URL - checkoutUrlに修正
          if (data?.checkoutUrl) {
            window.location.href = data.checkoutUrl
          }
        },
        onError: (error) => {
          toast.error(error.message || 'Failed to create checkout session')
        },
      }
    )
  }

  if (plansLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const freePlan = plans?.find((p) => p.id === 'free')
  const indiePlan = plans?.find((p) => p.id === 'indie')
  const proPlan = plans?.find((p) => p.id === 'pro')

  return (
    <div className="space-y-8">
      {/* Billing cycle toggle */}
      <div className="flex items-center justify-center gap-4">
        <Label htmlFor="billing-toggle">{dict.pricing.monthly}</Label>
        {/* Switch component temporarily replaced with button */}
        <button
          id="billing-toggle"
          className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200"
          onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
        <div className="flex items-center gap-2">
          <Label htmlFor="billing-toggle">{dict.pricing.yearly}</Label>
          <span className="text-sm text-green-600 font-medium">{dict.pricing.yearlyDiscount}</span>
        </div>
      </div>

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <Card className={subscription?.plan === 'free' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle>{freePlan?.name}</CardTitle>
            <CardDescription>{freePlan?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">{dict.pricing.free}</div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.projectLimit || 'Project limit'}:{' '}
                  {freePlan?.features.projectLimit}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.apiCalls || 'API calls/month'}:{' '}
                  {freePlan?.features.apiCallsPerMonth}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.teamMembers || 'Team members'}:{' '}
                  {freePlan?.features.teamMembers}
                </span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={subscription?.plan === 'free' ? 'outline' : 'default'}
              disabled={subscription?.plan === 'free'}
            >
              {subscription?.plan === 'free' ? dict.pricing.currentPlan : dict.pricing.selectPlan}
            </Button>
          </CardFooter>
        </Card>

        {/* Indie Plan */}
        <Card className={subscription?.plan === 'indie' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle>{indiePlan?.name}</CardTitle>
            <CardDescription>{indiePlan?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-3xl font-bold">
                ¥{billingCycle === 'monthly' ? indiePlan?.monthlyPrice : indiePlan?.yearlyPrice}
              </span>
              <span className="text-muted-foreground">/{dict.pricing.period[billingCycle]}</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.projectLimit || 'Project limit'}:{' '}
                  {indiePlan?.features.projectLimit}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.apiCalls || 'API calls/month'}:{' '}
                  {indiePlan?.features.apiCallsPerMonth.toLocaleString()}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.teamMembers || 'Team members'}:{' '}
                  {indiePlan?.features.teamMembers}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.storage || 'Storage'}: {indiePlan?.features.storage}GB
                </span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={subscription?.plan === 'indie' ? 'outline' : 'default'}
              onClick={() => handleSelectPlan('indie')}
              disabled={
                createCheckout.isPending ||
                (subscription?.plan === 'indie' && subscription?.billingCycle === billingCycle)
              }
            >
              {createCheckout.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {subscription?.plan === 'indie' && subscription?.billingCycle === billingCycle
                ? dict.pricing.currentPlan
                : dict.pricing.selectPlan}
            </Button>
          </CardFooter>
        </Card>

        {/* Pro Plan */}
        <Card className={`relative ${subscription?.plan === 'pro' ? 'border-primary' : ''}`}>
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
              {dict.pricing.popular}
            </span>
          </div>
          <CardHeader>
            <CardTitle>{proPlan?.name}</CardTitle>
            <CardDescription>{proPlan?.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <span className="text-3xl font-bold">
                ¥{billingCycle === 'monthly' ? proPlan?.monthlyPrice : proPlan?.yearlyPrice}
              </span>
              <span className="text-muted-foreground">/{dict.pricing.period[billingCycle]}</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.projectLimit || 'Unlimited projects'}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.apiCalls || 'API calls/month'}:{' '}
                  {proPlan?.features.apiCallsPerMonth.toLocaleString()}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.teamMembers || 'Team members'}:{' '}
                  {proPlan?.features.teamMembers === -1
                    ? 'Unlimited'
                    : proPlan?.features.teamMembers}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.storage || 'Storage'}: {proPlan?.features.storage}GB
                </span>
              </li>
              <li className="flex items-start gap-2">
                <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  {dict.pricing.features?.support || 'Priority support'}
                </span>
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              className="w-full"
              variant={subscription?.plan === 'pro' ? 'outline' : 'default'}
              onClick={() => handleSelectPlan('pro')}
              disabled={
                createCheckout.isPending ||
                (subscription?.plan === 'pro' && subscription?.billingCycle === billingCycle)
              }
            >
              {createCheckout.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {subscription?.plan === 'pro' && subscription?.billingCycle === billingCycle
                ? dict.pricing.currentPlan
                : dict.pricing.selectPlan}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
