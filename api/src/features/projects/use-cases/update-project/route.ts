import { createRoute } from '@hono/zod-openapi'
import {
  updateProjectParamsSchema,
  updateProjectRequestSchema,
  updateProjectResponseSchema,
} from './dto.js'
import { errorResponses } from '../../../../_shared/utils/error/index.js'

export const updateProjectRoute = createRoute({
  method: 'put',
  path: '/projects/{id}',
  tags: ['Projects'],
  summary: 'プロジェクト更新',
  description: '指定されたIDのプロジェクトを更新します',
  request: {
    params: updateProjectParamsSchema,
    body: {
      content: {
        'application/json': {
          schema: updateProjectRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '更新されたプロジェクト',
      content: {
        'application/json': {
          schema: updateProjectResponseSchema,
        },
      },
    },
    ...errorResponses,
  },
})