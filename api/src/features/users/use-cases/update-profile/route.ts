import { createRoute, z } from '@hono/zod-openapi'
import { errorResponses } from '../../../../_shared/utils/error/index.js'
import { updateProfileReqSchema, userProfileResSchema } from './dto.js'

export const updateProfileRoute = createRoute({
  method: 'put',
  path: '/users/me',
  operationId: 'updateProfile',
  tags: ['users'],
  summary: 'プロフィール更新',
  description: '認証済みユーザーの自分のプロフィール情報を更新します',
  security: [{ bearerAuth: [] }],
  request: {
    body: {
      content: {
        'application/json': {
          schema: updateProfileReqSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: 'プロフィール更新成功',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: userProfileResSchema,
            metadata: z.object({
              timestamp: z.string().datetime(),
              version: z.string(),
            }),
          }),
        },
      },
    },
    ...errorResponses,
  },
})
