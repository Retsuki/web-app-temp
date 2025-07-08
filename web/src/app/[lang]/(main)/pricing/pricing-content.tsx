'use client'

import { CheckIcon, Loader2 } from 'lucide-react'
// import { Switch } from '@/components/ui/switch'
// import { useRouter } from '@/i18n/routing'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { useAuth } from '@/contexts/auth-context'
// import { useCreateCheckout, usePlans, useSubscription } from '@/lib/api/hooks/useBilling'

export default function PricingContent({ dict }: { dict: any }) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const { user } = useAuth()
  const router = useRouter()
  // Temporarily commented out due to missing imports
  // const { data: plans, isLoading: plansLoading } = usePlans()
  // const { data: subscription } = useSubscription()
  // const createCheckout = useCreateCheckout()

  // Temporary mock data
  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic features',
      features: ['Basic feature 1', 'Basic feature 2'],
    },
    {
      id: 'indie',
      name: 'Indie',
      description: 'For individuals',
      features: ['All free features', 'Indie feature 1'],
      monthlyPrice: 1000,
      yearlyPrice: 10000,
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For professionals',
      features: ['All indie features', 'Pro feature 1'],
      monthlyPrice: 3000,
      yearlyPrice: 30000,
    },
  ]
  const plansLoading = false
  const subscription = null
  const createCheckout = { mutate: () => {}, isPending: false }

  const handleSelectPlan = async (planId: 'indie' | 'pro') => {
    if (!user) {
      router.push('/signin')
      return
    }

    if (subscription?.plan === planId && subscription?.billingCycle === billingCycle) {
      // Already on this plan
      return
    }

    createCheckout.mutate({ planId, billingCycle })
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
              {freePlan?.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
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
              {indiePlan?.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
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
              {proPlan?.features.map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
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
