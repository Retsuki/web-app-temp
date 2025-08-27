import type { App } from '../../_shared/factory/index.js'
import { AppHTTPException } from '../../_shared/utils/error/error-exception.js'
import { ERROR_CODES } from '../../_shared/utils/error/index.js'
import { setupUserRoute } from './use-cases/setup-user/route.js'

export const authApi = (app: App) => {
  // POST /auth/setup - 新規ユーザーセットアップ
  app.openapi(setupUserRoute, async (c) => {
    const body = c.req.valid('json')
    const { auth } = c.get('services')
    
    // JWTトークンからユーザーIDを取得して検証
    const tokenUserId = c.get('userId')
    
    // リクエストのuserIdとトークンのuserIdが一致することを確認
    if (tokenUserId !== body.userId) {
      throw new AppHTTPException(403, {
        code: ERROR_CODES.FORBIDDEN,
        message: '不正なリクエストです',
      })
    }
    
    const result = await auth.setupUser.execute(body)
    return c.json(result, 201)
  })
}