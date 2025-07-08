'use client'

import { format } from 'date-fns'
import { enUS, ja } from 'date-fns/locale'
import { Loader2 } from 'lucide-react'
// import { useRouter } from '@/i18n/routing'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
// import {
//   useCancelSubscription,
//   usePaymentHistory,
//   useSubscription,
// } from '@/lib/api/hooks/useBilling'
import type { Dictionary } from '../../dictionaries'

export default function BillingContent({ dict }: { dict: Dictionary }) {
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  // Temporarily commented out due to missing imports
  // const { data: subscription, isLoading: subscriptionLoading } = useSubscription()
  // const { data: history, isLoading: historyLoading } = usePaymentHistory({ limit: 10 })
  // const cancelSubscription = useCancelSubscription()

  // Temporary mock data
  const subscription = null
  const subscriptionLoading = false
  const history = null
  const historyLoading = false
  const cancelSubscription = { mutateAsync: async () => {}, isPending: false }

  const router = useRouter()
  const { toast } = useToast()

  const locale = dict.common.locale === 'ja' ? ja : enUS

  const handleCancelSubscription = async () => {
    try {
      await cancelSubscription.mutateAsync()
      setShowCancelDialog(false)
      toast({
        title: dict.common.success,
        description: dict.billing.cancelSuccess || 'Subscription canceled successfully',
      })
    } catch (_error) {
      toast({
        title: dict.common.error,
        description: dict.billing.cancelError || 'Failed to cancel subscription',
        variant: 'destructive',
      })
    }
  }

  if (subscriptionLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const statusVariant = {
    active: 'default',
    canceled: 'secondary',
    past_due: 'destructive',
    unpaid: 'destructive',
    trialing: 'outline',
  } as const

  return (
    <div className="space-y-8">
      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>{dict.billing.subscription}</CardTitle>
          <CardDescription>
            {dict.billing.currentPlan}: {subscription?.plan?.toUpperCase() || 'FREE'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription ? (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{dict.billing.status}</span>
                <Badge variant={statusVariant[subscription.status] || 'default'}>
                  {dict.billing.subscriptionStatus[subscription.status]}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{dict.billing.billingCycle}</span>
                <span className="font-medium">
                  {subscription.billingCycle === 'monthly'
                    ? dict.pricing.monthly
                    : dict.pricing.yearly}
                </span>
              </div>
              {subscription.currentPeriodEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {dict.billing.nextBillingDate}
                  </span>
                  <span className="font-medium">
                    {format(new Date(subscription.currentPeriodEnd), 'PPP', { locale })}
                  </span>
                </div>
              )}
              {subscription.monthlyUsageCount !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{dict.billing.monthlyUsage}</span>
                  <span className="font-medium">
                    {subscription.monthlyUsageCount} / {subscription.monthlyUsageLimit || '∞'}
                  </span>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <Button onClick={() => router.push('/pricing')}>{dict.billing.changePlan}</Button>
                {subscription.status === 'active' && (
                  <Button variant="outline" onClick={() => setShowCancelDialog(true)}>
                    {dict.billing.cancelSubscription}
                  </Button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">You are currently on the Free plan</p>
              <Button onClick={() => router.push('/pricing')}>Upgrade to Pro</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>{dict.billing.paymentHistory}</CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : history?.items && history.items.length > 0 ? (
            <div className="space-y-2">
              {history.items.map((payment) => (
                <div
                  key={payment.paymentId}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{payment.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.createdAt), 'PPP', { locale })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      ¥{payment.amount.toLocaleString()} {payment.currency.toUpperCase()}
                    </p>
                    <Badge variant={payment.status === 'succeeded' ? 'default' : 'destructive'}>
                      {dict.billing.paymentStatus[payment.status]}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No payment history available</p>
          )}
        </CardContent>
      </Card>

      {/* Cancel Subscription Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dict.billing.cancelConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{dict.billing.cancelConfirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={cancelSubscription.isPending}
            >
              {cancelSubscription.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {dict.billing.cancelSubscription}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
