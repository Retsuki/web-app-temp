import type { App } from '../../_shared/factory/index.js'
import { validateUserId } from '../../_shared/utils/auth/index.js'
import { cancelSubscriptionRoute } from './use-cases/cancel-subscription/route.js'
import { createCheckoutRoute } from './use-cases/create-checkout/route.js'
import { getPaymentHistoryRoute } from './use-cases/get-payment-history/route.js'
import { getPlansRoute } from './use-cases/get-plans/route.js'
import { getSubscriptionRoute } from './use-cases/get-subscription/route.js'
import { updateSubscriptionRoute } from './use-cases/update-subscription/route.js'

export const billingApi = (app: App) => {
  // GET /plans - Get available plans
  app.openapi(getPlansRoute, async (c) => {
    const { billing } = c.get('services')
    const result = await billing.getPlansUseCase.execute()
    return c.json(result, 200)
  })

  // GET /billing/subscription - Get current subscription
  app.openapi(getSubscriptionRoute, async (c) => {
    const userId = validateUserId(c)
    const { billing } = c.get('services')
    const subscription = await billing.getSubscriptionUseCase.execute(userId)
    return c.json(subscription, 200)
  })

  // GET /billing/history - Get payment history
  app.openapi(getPaymentHistoryRoute, async (c) => {
    const userId = validateUserId(c)
    const { limit } = c.req.valid('query')
    const { billing } = c.get('services')
    const result = await billing.getPaymentHistoryUseCase.execute(userId, limit)
    return c.json(result, 200)
  })

  // POST /billing/checkout - Create checkout session
  app.openapi(createCheckoutRoute, async (c) => {
    const userId = validateUserId(c)
    const body = c.req.valid('json')
    const { billing } = c.get('services')
    const result = await billing.createCheckoutUseCase.execute(userId, body)
    return c.json(result, 200)
  })

  // PATCH /billing/subscription - Update subscription
  app.openapi(updateSubscriptionRoute, async (c) => {
    const userId = validateUserId(c)
    const body = c.req.valid('json')
    const { billing } = c.get('services')
    const result = await billing.updateSubscriptionUseCase.execute(userId, body)
    return c.json(result, 200)
  })

  // DELETE /billing/subscription - Cancel subscription
  app.openapi(cancelSubscriptionRoute, async (c) => {
    const userId = validateUserId(c)
    const body = c.req.valid('json')
    const { billing } = c.get('services')
    const result = await billing.cancelSubscriptionUseCase.execute(userId, body)
    return c.json(result, 200)
  })
}
