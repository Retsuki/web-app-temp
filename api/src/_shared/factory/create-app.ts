import { swaggerUI } from '@hono/swagger-ui'
import { OpenAPIHono } from '@hono/zod-openapi'
import { except } from 'hono/combine'
import { logger } from 'hono/logger'
import { poweredBy } from 'hono/powered-by'
import { prettyJSON } from 'hono/pretty-json'
import { requestId } from 'hono/request-id'
import { authMiddleware } from '../middleware/auth/index.js'
import { corsMiddleware } from '../middleware/cors.js'
// import { edgeAuth } from '../middleware/edge-auth.js'
import { serviceContainerMiddleware } from '../middleware/service-container/index.js'
import type { AppEnv } from '../types/context.js'
import { handleError, handleZodError } from '../utils/error/index.js'

export const createApp = () => {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: handleZodError,
  }).basePath('/api/v1')

  // middleware
  app.onError(handleError)
  app.use(serviceContainerMiddleware)
  // app.use(edgeAuth)
  app.use(prettyJSON(), poweredBy(), logger(), requestId())
  app.use(
    '/*',
    corsMiddleware,
    except(
      [
        //
        '/api/v1/ui',
        '/api/v1/doc',
        '/api/v1/health',
        '/api/v1/stripe/webhook',
      ],
      authMiddleware
    )
  )

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
