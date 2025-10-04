import { createFactory } from 'hono/factory'
import { AppHTTPException } from '../../utils/error/index.js'
import { ServiceContainer } from './container.js'

// Singleton instance
let serviceContainer: ServiceContainer

// Factory for creating middleware
const factory = createFactory()

/**
 * ServiceContainerを初期化してコンテキストに設定するミドルウェア
 */
export const serviceContainerMiddleware = factory.createMiddleware(async (c, next) => {
  const googleCloudProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID
  if (!googleCloudProjectId) {
    throw new AppHTTPException(500, {
      message: 'GOOGLE_CLOUD_PROJECT_ID is not set',
    })
  }

  // ServiceContainerの初期化（シングルトン）
  if (!serviceContainer) {
    serviceContainer = new ServiceContainer({
      googleCloudProjectId: googleCloudProjectId,
    })
  }

  // コンテキストに設定
  c.set('services', serviceContainer)
  await next()
})
