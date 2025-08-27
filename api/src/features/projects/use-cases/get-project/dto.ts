import { z } from '@hono/zod-openapi'

export const getProjectParamsSchema = z.object({
  id: z.string().uuid(),
})

export const getProjectResponseSchema = z.object({
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

export type GetProjectParams = z.infer<typeof getProjectParamsSchema>
export type GetProjectResponse = z.infer<typeof getProjectResponseSchema>