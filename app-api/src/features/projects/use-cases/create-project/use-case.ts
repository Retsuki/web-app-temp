import type { ProjectRepository } from '../../repositories/project.repository.js'
import type { CreateProjectRequest, CreateProjectResponse } from './dto.js'

export class CreateProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(userId: string, request: CreateProjectRequest): Promise<CreateProjectResponse> {
    const project = await this.projectRepository.create({
      userId,
      name: request.name,
      description: request.description || null,
      status: request.status || 'active',
      metadata: request.metadata || {},
      startDate: request.startDate ? new Date(request.startDate) : null,
      endDate: request.endDate ? new Date(request.endDate) : null,
    })

    return {
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
    }
  }
}
