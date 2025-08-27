import type { App } from '../../_shared/types/index.js'
import { validateUserId } from '../../_shared/utils/auth/index.js'
import { listProjectsRoute } from './use-cases/list-projects/route.js'
import { getProjectRoute } from './use-cases/get-project/route.js'
import { createProjectRoute } from './use-cases/create-project/route.js'
import { updateProjectRoute } from './use-cases/update-project/route.js'
import { deleteProjectRoute } from './use-cases/delete-project/route.js'

export const projectsApi = (app: App) => {
  // プロジェクト一覧取得
  app.openapi(listProjectsRoute, async (c) => {
    const userId = validateUserId(c)
    const { projects } = c.get('services')
    const result = await projects.listProjects.execute(userId)
    return c.json(result, 200)
  })

  // プロジェクト詳細取得
  app.openapi(getProjectRoute, async (c) => {
    const userId = validateUserId(c)
    const { id } = c.req.param()
    const { projects } = c.get('services')
    const result = await projects.getProject.execute(id, userId)
    return c.json(result, 200)
  })

  // プロジェクト作成
  app.openapi(createProjectRoute, async (c) => {
    const userId = validateUserId(c)
    const body = c.req.valid('json')
    const { projects } = c.get('services')
    const result = await projects.createProject.execute(userId, body)
    return c.json(result, 201)
  })

  // プロジェクト更新
  app.openapi(updateProjectRoute, async (c) => {
    const userId = validateUserId(c)
    const { id } = c.req.param()
    const body = c.req.valid('json')
    const { projects } = c.get('services')
    const result = await projects.updateProject.execute(id, userId, body)
    return c.json(result, 200)
  })

  // プロジェクト削除
  app.openapi(deleteProjectRoute, async (c) => {
    const userId = validateUserId(c)
    const { id } = c.req.param()
    const { projects } = c.get('services')
    const result = await projects.deleteProject.execute(id, userId)
    return c.json(result, 200)
  })

  return app
}