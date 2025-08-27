import { createRoute } from '@hono/zod-openapi'
import { errorResponses } from '../../../../_shared/utils/error/index.js'
import { getProjectParamsSchema, getProjectResponseSchema } from './dto.js'

export const getProjectRoute = createRoute({
  method: 'get',
  path: '/projects/{id}',
  tags: ['Projects'],
  summary: 'プロジェクト詳細取得',
  description: '指定されたIDのプロジェクト詳細を取得します',
  request: {
    params: getProjectParamsSchema,
  },
  responses: {
    200: {
      description: 'プロジェクト詳細',
      content: {
        'application/json': {
          schema: getProjectResponseSchema,
        },
      },
    },
    ...errorResponses,
  },
})
