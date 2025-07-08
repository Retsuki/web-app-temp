import { createRoute } from '@hono/zod-openapi'
import { errorResponses } from '../../../../_shared/utils/error/index.js'
import { deleteAccountReqSchema } from './dto.js'

export const deleteAccountRoute = createRoute({
  method: 'delete',
  path: '/users/me',
  tags: ['users'],
  summary: 'アカウント削除',
  description: '認証済みユーザーのアカウントを論理削除します。この操作は取り消せません。',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: deleteAccountReqSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: 'アカウント削除成功',
    },
    ...errorResponses,
  },
})
