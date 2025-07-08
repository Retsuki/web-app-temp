import createClient from 'openapi-fetch'
import type { paths } from './schema'

export const apiClient = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  headers: {
    'Content-Type': 'application/json',
  },
})
