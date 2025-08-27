import { z } from '@hono/zod-openapi'

export const deleteProjectParamsSchema = z.object({
  id: z.string().uuid(),
})

export const deleteProjectResponseSchema = z.object({
  message: z.string(),
})

export type DeleteProjectParams = z.infer<typeof deleteProjectParamsSchema>
export type DeleteProjectResponse = z.infer<typeof deleteProjectResponseSchema>