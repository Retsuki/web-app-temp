'use client'

import type { Dictionary } from '@/features/i18n'
import { useGetSubscription } from '@/lib/api/generated/billing/billing'

export default function BillingStatus({ dict }: { dict: Dictionary }) {
  const { data, isLoading, error } = useGetSubscription()

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
        <div className="h-8 bg-gray-200 rounded w-1/2" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-4 bg-gray-50 border rounded">
        <h2 className="text-lg font-medium text-gray-900 mb-2">{dict.billing.title}</h2>
        <p className="text-sm text-gray-600">No active subscription</p>
      </div>
    )
  }

  const s = data

  return (
    <div className="p-4 bg-gray-50 border rounded">
      <h2 className="text-lg font-medium text-gray-900 mb-2">{dict.billing.title}</h2>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-gray-500">Plan</dt>
          <dd className="mt-1 text-sm text-gray-900">{s.plan}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">{dict.billing.subscription}</dt>
          <dd className="mt-1 text-sm text-gray-900">{s.status}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">{dict.billing.billingCycle}</dt>
          <dd className="mt-1 text-sm text-gray-900">{s.billingCycle}</dd>
        </div>
        <div>
          <dt className="text-sm text-gray-500">Current Period</dt>
          <dd className="mt-1 text-sm text-gray-900">
            {new Date(s.currentPeriodStart).toLocaleDateString()} - {new Date(s.currentPeriodEnd).toLocaleDateString()}
          </dd>
        </div>
        {s.cancelAt && (
          <div>
            <dt className="text-sm text-gray-500">Cancel At</dt>
            <dd className="mt-1 text-sm text-gray-900">{new Date(s.cancelAt).toLocaleDateString()}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}

