import { z } from '@hono/zod-openapi'

export const updateProjectParamsSchema = z.object({
  id: z.string().uuid(),
})

export const updateProjectRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(['active', 'archived', 'completed']).optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
  priority: z.number().min(0).max(2).optional(),
  progress: z.number().min(0).max(100).optional(),
})

export const updateProjectResponseSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  status: z.string(),
  tags: z.array(z.unknown()),
  metadata: z.record(z.unknown()),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  priority: z.number(),
  progress: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type UpdateProjectParams = z.infer<typeof updateProjectParamsSchema>
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>
export type UpdateProjectResponse = z.infer<typeof updateProjectResponseSchema>