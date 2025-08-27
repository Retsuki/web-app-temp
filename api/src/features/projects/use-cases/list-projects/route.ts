import { createRoute } from '@hono/zod-openapi'
import { errorResponses } from '../../../../_shared/utils/error/index.js'
import { listProjectsResponseSchema } from './dto.js'

export const listProjectsRoute = createRoute({
  method: 'get',
  path: '/projects',
  tags: ['Projects'],
  summary: 'プロジェクト一覧取得',
  description: 'ログインユーザーのプロジェクト一覧を取得します',
  responses: {
    200: {
      description: 'プロジェクト一覧',
      content: {
        'application/json': {
          schema: listProjectsResponseSchema,
        },
      },
    },
    ...errorResponses,
  },
})
