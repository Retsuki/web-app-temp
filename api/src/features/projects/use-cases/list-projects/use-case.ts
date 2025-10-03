import type { ProjectRepository } from '../../repositories/project.repository.js'
import type { ListProjectsResponse } from './dto.js'

export class ListProjectsUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(userId: string): Promise<ListProjectsResponse> {
    const [projects, total] = await Promise.all([
      this.projectRepository.findByUserId(userId),
      this.projectRepository.countByUserId(userId),
    ])

    return {
      projects: projects.map((project) => ({
        id: project.id,
        userId: project.userId,
        name: project.name,
        description: project.description,
        status: project.status,
        metadata: project.metadata as Record<string, unknown>,
        startDate: project.startDate?.toISOString() || null,
        endDate: project.endDate?.toISOString() || null,
        createdAt: project.createdAt?.toISOString() || new Date().toISOString(),
        updatedAt: project.updatedAt?.toISOString() || new Date().toISOString(),
      })),
      total,
    }
  }
}
