import 'dotenv/config'
import { serve } from '@hono/node-server'
import { createApp } from './_shared/factory/create-app.js'
import { billingApi } from './features/billing/index.js'
import { healthApi } from './features/health/index.js'
import { stripeWebhookApi } from './features/stripe-webhook/index.js'
import { usersApi } from './features/users/index.js'

const app = createApp()

// API routes
usersApi(app)
healthApi(app)
billingApi(app)
stripeWebhookApi(app)

const port = Number(process.env.PORT) || 8080
serve(
  {
    fetch: app.fetch,
    port,
  },
  () => {
    console.log(`🚀 サーバーが起動しました！ポート: http://localhost:${port}`)
    console.log(`🚀 Swagger UI: http://localhost:${port}/api/v1/ui`)
  }
)
