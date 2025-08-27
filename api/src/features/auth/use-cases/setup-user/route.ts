import { createRoute } from '@hono/zod-openapi'
import { errorResponses } from '../../../../_shared/utils/error/index.js'
import { setupUserRequestSchema, setupUserResponseSchema } from './dto.js'

export const setupUserRoute = createRoute({
  method: 'post',
  path: '/auth/setup',
  tags: ['auth'],
  summary: '新規ユーザーのセットアップ',
  description:
    'Supabase Auth でユーザー作成後、プロフィールと初期プロジェクトを作成します。エラー時はユーザーを削除します。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: setupUserRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: 'セットアップ成功',
      content: {
        'application/json': {
          schema: setupUserResponseSchema,
        },
      },
    },
    ...errorResponses,
  },
  security: [
    {
      Bearer: [],
    },
  ],
})
