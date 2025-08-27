import { createRoute } from '@hono/zod-openapi'
import { deleteProjectParamsSchema, deleteProjectResponseSchema } from './dto.js'
import { errorResponses } from '../../../../_shared/utils/error/index.js'

export const deleteProjectRoute = createRoute({
  method: 'delete',
  path: '/projects/{id}',
  tags: ['Projects'],
  summary: 'プロジェクト削除',
  description: '指定されたIDのプロジェクトを削除します（論理削除）',
  request: {
    params: deleteProjectParamsSchema,
  },
  responses: {
    200: {
      description: '削除完了',
      content: {
        'application/json': {
          schema: deleteProjectResponseSchema,
        },
      },
    },
    ...errorResponses,
  },
})