import { AppHTTPException } from '../../../../_shared/utils/error/index.js'
import { ERROR_CODES } from '../../../../_shared/utils/error/codes.js'
import type { ProjectRepository } from '../../repositories/project.repository.js'
import type { GetProjectResponse } from './dto.js'

export class GetProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(id: string, userId: string): Promise<GetProjectResponse> {
    const project = await this.projectRepository.findById(id, userId)

    if (!project) {
      throw new AppHTTPException(404, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'プロジェクトが見つかりません',
      })
    }

    return {
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
    }
  }
}