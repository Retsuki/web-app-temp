// src/utils/error/httpException.ts
/** biome-ignore-all lint/suspicious/noExplicitAny: false positive */

import { HTTPException } from 'hono/http-exception'
import type { StatusCode } from 'hono/utils/http-status'
import type { ErrorCode } from './error-code.js'

interface AppHTTPExceptionOptions {
  message?: string
  code?: ErrorCode
  cause?: any
}

export class AppHTTPException extends HTTPException {
  public code?: ErrorCode

  constructor(status: StatusCode = 500, options: AppHTTPExceptionOptions = {}) {
    super(status as any, { message: options.message, cause: options.cause })
    this.code = options.code
  }
}
