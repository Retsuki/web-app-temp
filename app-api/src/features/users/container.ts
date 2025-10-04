import type { Database } from '../../drizzle/index.js'
import { UserRepository } from './repositories/user.repository.js'
import { CreateUserUseCase } from './use-cases/create-user/use-case.js'
import { DeleteUserAccountUseCase } from './use-cases/delete-account/use-case.js'
import { GetUserProfileUseCase } from './use-cases/get-profile/use-case.js'
import { UpdateUserProfileUseCase } from './use-cases/update-profile/use-case.js'

export class UserContainer {
  public readonly repository: UserRepository
  public readonly getProfile: GetUserProfileUseCase
  public readonly updateProfile: UpdateUserProfileUseCase
  public readonly deleteAccount: DeleteUserAccountUseCase
  public readonly createUser: CreateUserUseCase

  constructor(db: Database) {
    // Initialize repository
    this.repository = new UserRepository(db)

    // Initialize use cases
    this.getProfile = new GetUserProfileUseCase(this.repository)
    this.updateProfile = new UpdateUserProfileUseCase(this.repository)
    this.deleteAccount = new DeleteUserAccountUseCase(this.repository)
    this.createUser = new CreateUserUseCase(this.repository)
  }
}
