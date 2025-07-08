import type { App } from '../../_shared/factory/create-app.js'
import { validateUserId } from '../../_shared/utils/auth/index.js'
import { createUserRoute } from './use-cases/create-user/route.js'
import { deleteAccountRoute } from './use-cases/delete-account/route.js'
import { getProfileRoute } from './use-cases/get-profile/route.js'
import { updateProfileRoute } from './use-cases/update-profile/route.js'

export const usersApi = (app: App) => {
  // POST /users - ユーザー作成（認証不要）
  app.openapi(createUserRoute, async (c) => {
    const body = c.req.valid('json')
    const { users } = c.get('services')

    const profile = await users.createUser.execute(body)

    return c.json(profile, 201)
  })

  // GET /users/me - プロフィール取得
  app.openapi(getProfileRoute, async (c) => {
    const userId = validateUserId(c)
    const { users } = c.get('services')

    const profile = await users.getProfile.execute(userId)

    return c.json(
      {
        success: true,
        data: profile,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
      200
    )
  })

  // PUT /users/me - プロフィール更新
  app.openapi(updateProfileRoute, async (c) => {
    const userId = validateUserId(c)
    const body = c.req.valid('json')
    const { users } = c.get('services')

    const profile = await users.updateProfile.execute(userId, body)

    return c.json(
      {
        success: true,
        data: profile,
        metadata: {
          timestamp: new Date().toISOString(),
          version: '1.0.0',
        },
      },
      200
    )
  })

  // DELETE /users/me - アカウント削除
  app.openapi(deleteAccountRoute, async (c) => {
    const userId = validateUserId(c)
    const body = c.req.valid('json')
    const { users } = c.get('services')

    await users.deleteAccount.execute(userId, body)

    return c.body(null, 204)
  })
}
