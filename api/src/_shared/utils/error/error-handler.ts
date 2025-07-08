// apps/backend/src/utils/error/error-handler.ts

import type { Context } from 'hono'
import { ZodError } from 'zod'
import type { AppEnv } from '../../types/context.js'
import { logger } from '../logger.js'
import { ERROR_CODES } from './error-code.js'
import { AppHTTPException } from './error-exception.js'
import { errorResponseSchema } from './error-schema.js'

export function handleError(error: Error, c: Context) {
  logger.error(error.message)
  const requestId = c.get('requestId') || ''

  if (error instanceof ZodError) {
    return c.json(
      {
        error: {
          code: ERROR_CODES.INVALID_TYPE,
          message: error.errors[0].message,
          requestId,
          statusCode: 400,
        },
      },
      400
    )
  }

  // 独自例外 (AppHTTPException) の場合
  if (error instanceof AppHTTPException) {
    const status = error.status
    const message = error.message || 'Error'
    const errorCode = error.code || ERROR_CODES.UNKNOWN_ERROR

    const data = errorResponseSchema.parse({
      error: {
        code: errorCode,
        message,
        requestId,
        statusCode: status,
      },
    })
    return c.json(data, status)
  }

  // 独自例外 (AppHTTPException) 以外の場合
  const data = errorResponseSchema.parse({
    error: {
      code: ERROR_CODES.UNKNOWN_ERROR,
      message: error.message || 'Error',
      requestId,
      statusCode: 500,
    },
  })
  return c.json(data, 500)
}

export const handleZodError = (
  result:
    | {
        success: true
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        data: any
      }
    | {
        success: false
        error: ZodError
      },
  c: Context<AppEnv>
) => {
  if (!result.success) {
    return handleError(result.error, c)
  }
}
