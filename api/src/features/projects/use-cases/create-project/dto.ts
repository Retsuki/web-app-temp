import { z } from '@hono/zod-openapi'

export const createProjectRequestSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  metadata: z.record(z.unknown()).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

export const createProjectResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  metadata: z.record(z.unknown()),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CreateProjectRequest = z.infer<typeof createProjectRequestSchema>
export type CreateProjectResponse = z.infer<typeof createProjectResponseSchema>
