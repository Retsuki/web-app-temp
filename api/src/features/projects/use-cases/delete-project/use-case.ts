import { AppHTTPException } from '../../../../_shared/utils/error/index.js'
import { ERROR_CODES } from '../../../../_shared/utils/error/error-code.js'
import type { ProjectRepository } from '../../repositories/project.repository.js'
import type { DeleteProjectResponse } from './dto.js'

export class DeleteProjectUseCase {
  constructor(private readonly projectRepository: ProjectRepository) {}

  async execute(id: string, userId: string): Promise<DeleteProjectResponse> {
    const project = await this.projectRepository.delete(id, userId)

    if (!project) {
      throw new AppHTTPException(404, {
        code: ERROR_CODES.NOT_FOUND,
        message: 'プロジェクトが見つかりません',
      })
    }

    return {
      message: 'プロジェクトを削除しました',
    }
  }
}