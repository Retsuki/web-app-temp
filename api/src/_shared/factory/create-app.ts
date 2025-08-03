import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { except } from 'hono/combine'
import { logger } from 'hono/logger'
import { poweredBy } from 'hono/powered-by'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { cloudRunAuthMiddleware, supabaseAuthMiddleware } from '../middleware/auth/index.js'
import { corsMiddleware } from '../middleware/cors/index.js'
import { serviceContainerMiddleware } from '../middleware/service-container/index.js'
import type { AppEnv } from '../types/context.js'
import { handleError, handleZodError } from '../utils/error/index.js'

const PUBLIC_PATHS = ['/api/v1/ui', '/api/v1/doc', '/api/v1/health', '/api/v1/stripe/webhook']

export const createApp = () => {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: handleZodError,
  }).basePath('/api/v1')

  // middleware
  app.onError(handleError)
  // app.use(edgeAuth)
  app.use(serviceContainerMiddleware)
  app.use(prettyJSON(), poweredBy(), logger(), requestId())
  app.use(corsMiddleware)
  app.use('/*', except(PUBLIC_PATHS, cloudRunAuthMiddleware))
  app.use('/*', except(PUBLIC_PATHS, supabaseAuthMiddleware))

  // swagger ui
  app.get('/ui', swaggerUI({ url: '/api/v1/doc' }))
  app.doc('/doc', {
    openapi: '3.0.0',
    info: {
      title: 'API',
      version: '1.0.0',
    },
  })

  return app
}

export type App = ReturnType<typeof createApp>
