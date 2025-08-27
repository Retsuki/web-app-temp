import { createRoute } from '@hono/zod-openapi'
import { createProjectRequestSchema, createProjectResponseSchema } from './dto.js'
import { errorResponses } from '../../../../_shared/utils/error/index.js'

export const createProjectRoute = createRoute({
  method: 'post',
  path: '/projects',
  tags: ['Projects'],
  summary: 'プロジェクト作成',
  description: '新しいプロジェクトを作成します',
  request: {
    body: {
      content: {
        'application/json': {
          schema: createProjectRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: '作成されたプロジェクト',
      content: {
        'application/json': {
          schema: createProjectResponseSchema,
        },
      },
    },
    ...errorResponses,
  },
})