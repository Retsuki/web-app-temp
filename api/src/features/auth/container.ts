import type { ProjectRepository } from '../projects/repositories/project.repository.js'
import type { UserRepository } from '../users/repositories/user.repository.js'
import { SetupUserUseCase } from './use-cases/setup-user/use-case.js'

export class AuthContainer {
  public readonly setupUser: SetupUserUseCase

  constructor(userRepository: UserRepository, projectRepository: ProjectRepository) {
    this.setupUser = new SetupUserUseCase(userRepository, projectRepository)
  }
}
