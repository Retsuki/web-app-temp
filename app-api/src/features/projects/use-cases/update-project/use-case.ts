import { ERROR_CODES } from '../../../../_shared/utils/error/error-code.js'
import { AppHTTPException } from '../../../../_shared/utils/error/index.js'
import type { ProjectRepository } from '../../repositories/project.repository.js'
import type { UpdateProjectRequest, UpdateProjectResponse } from './dto.js'

export class UpdateProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(
    id: string,
    userId: string,
    request: UpdateProjectRequest
  ): Promise<UpdateProjectResponse> {
    const updateData: any = {}

    if (request.name !== undefined) updateData.name = request.name
    if (request.description !== undefined) updateData.description = request.description
    if (request.status !== undefined) updateData.status = request.status
    if (request.metadata !== undefined) updateData.metadata = request.metadata
    if (request.startDate !== undefined) {
      updateData.startDate = request.startDate ? new Date(request.startDate) : null
    }
    if (request.endDate !== undefined) {
      updateData.endDate = request.endDate ? new Date(request.endDate) : null
    }

    const project = await this.projectRepository.update(id, userId, updateData)

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
      metadata: project.metadata as Record<string, unknown>,
      startDate: project.startDate?.toISOString() || null,
      endDate: project.endDate?.toISOString() || null,
      createdAt: project.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: project.updatedAt?.toISOString() || new Date().toISOString(),
    }
  }
}
