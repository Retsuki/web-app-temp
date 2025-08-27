import type { Database } from '../../drizzle/db/database.js'
import { ProjectRepository } from './repositories/project.repository.js'
import { CreateProjectUseCase } from './use-cases/create-project/use-case.js'
import { DeleteProjectUseCase } from './use-cases/delete-project/use-case.js'
import { GetProjectUseCase } from './use-cases/get-project/use-case.js'
import { ListProjectsUseCase } from './use-cases/list-projects/use-case.js'
import { UpdateProjectUseCase } from './use-cases/update-project/use-case.js'

export class ProjectContainer {
  public readonly repository: ProjectRepository
  public readonly listProjects: ListProjectsUseCase
  public readonly getProject: GetProjectUseCase
  public readonly createProject: CreateProjectUseCase
  public readonly updateProject: UpdateProjectUseCase
  public readonly deleteProject: DeleteProjectUseCase

  constructor(db: Database) {
    this.repository = new ProjectRepository(db)
    this.listProjects = new ListProjectsUseCase(this.repository)
    this.getProject = new GetProjectUseCase(this.repository)
    this.createProject = new CreateProjectUseCase(this.repository)
    this.updateProject = new UpdateProjectUseCase(this.repository)
    this.deleteProject = new DeleteProjectUseCase(this.repository)
  }
}
