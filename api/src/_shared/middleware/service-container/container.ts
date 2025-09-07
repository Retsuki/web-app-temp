import { db } from "@app/drizzle/db/index.js"
import { AuthContainer } from "../../../features/auth/container.js"
import { BillingContainer } from "../../../features/billing/container.js"
import { ProjectContainer } from "../../../features/projects/container.js"
import { UserContainer } from "../../../features/users/container.js"
import { initializeFirebaseAdmin } from "../../lib/firebase-admin.js"

export interface AppConfig {
  googleCloudProjectId?: string
}

export class ServiceContainer {
  // Database
  public readonly db = db

  // Feature containers
  public readonly auth: AuthContainer
  public readonly users: UserContainer
  public readonly billing: BillingContainer
  public readonly projects: ProjectContainer

  constructor(_config: AppConfig) {
    // Firebase Admin SDKの初期化
    initializeFirebaseAdmin()

    // Initialize feature containers
    this.users = new UserContainer(db)
    this.billing = new BillingContainer(db)
    this.projects = new ProjectContainer(db)
    this.auth = new AuthContainer(
      db,
      this.users.repository,
      this.projects.repository,
    )
  }
}
