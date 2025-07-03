import type { App } from '../../_shared/factory/create-app.js'
import { validateUserId } from '../../_shared/utils/auth/index.js'
import { createCheckoutRoute } from './use-cases/create-checkout/route.js'

export const billingApi = (app: App) => {
  // POST /billing/checkout - Create checkout session
  app.openapi(createCheckoutRoute, async (c) => {
    const userId = validateUserId(c)
    const body = c.req.valid('json')
    const { billing } = c.get('services')

    const result = await billing.createCheckoutUseCase.execute(userId, body)

    return c.json(result, 200)
  })
}
