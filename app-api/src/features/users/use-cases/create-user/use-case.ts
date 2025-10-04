import { AppHTTPException } from '../../../../_shared/utils/error/error-exception.js'
import { ERROR_CODES } from '../../../../_shared/utils/error/index.js'
import type { UserRepository } from '../../repositories/user.repository.js'
import type { CreateUserRequest, CreateUserResponse } from './dto.js'

export class CreateUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(data: CreateUserRequest): Promise<CreateUserResponse> {
    const existingUser = await this.userRepository.findByUserId(data.userId)
    if (existingUser) {
      throw new AppHTTPException(409, {
        code: ERROR_CODES.CONFLICT,
        message: 'ユーザーは既に存在します',
      })
    }

    const emailExists = await this.userRepository.isEmailExists(data.email)
    if (emailExists) {
      throw new AppHTTPException(409, {
        code: ERROR_CODES.CONFLICT,
        message: 'このメールアドレスは既に使用されています',
      })
    }

    const user = await this.userRepository.create({
      userId: data.userId,
      email: data.email,
      nickname: data.nickname,
    })

    return {
      id: user.id,
      userId: user.userId,
      email: user.email,
      nickname: user.nickname,
      createdAt: user.createdAt?.toISOString() || new Date().toISOString(),
      updatedAt: user.updatedAt?.toISOString() || new Date().toISOString(),
    }
  }
}
