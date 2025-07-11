// src/utils/error/httpException.ts

import { HTTPException } from 'hono/http-exception'
import type { StatusCode } from 'hono/utils/http-status'
import type { ErrorCode } from './error-code.js'

interface AppHTTPExceptionOptions {
  message?: string
  code?: ErrorCode
  cause?: string
}

export class AppHTTPException extends HTTPException {
  public code?: ErrorCode

  constructor(status: StatusCode, options: AppHTTPExceptionOptions = {}) {
    super(status, { message: options.message, cause: options.cause })
    this.code = options.code
  }
}
