import { z } from '@hono/zod-openapi'

export const listProjectsResponseSchema = z.object({
  projects: z.array(
    z.object({
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
  ),
  total: z.number(),
})

export type ListProjectsResponse = z.infer<typeof listProjectsResponseSchema>
