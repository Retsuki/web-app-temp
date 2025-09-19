import type { projects as projectsTable } from '@app/drizzle/index.js'
import type { ProjectRepository } from '../../repositories/project.repository.js'
import type { ListProjectsResponse } from './dto.js'

export class ListProjectsUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(userId: string): Promise<ListProjectsResponse> {
    const [projects, total] = await Promise.all([
      this.projectRepository.findByUserId(userId),
      this.projectRepository.countByUserId(userId),
    ])

    type ProjectRow = typeof projectsTable.$inferSelect
    return {
      projects: projects.map((project: ProjectRow) => ({
        id: project.id,
        userId: project.userId,
        name: project.name,
        description: project.description,
        status: project.status,
        tags: project.tags as unknown[],
        metadata: project.metadata as Record<string, unknown>,
        startDate: project.startDate?.toISOString() || null,
        endDate: project.endDate?.toISOString() || null,
        priority: project.priority,
        progress: project.progress,
        createdAt: project.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: project.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      total,
    }
  }
}
