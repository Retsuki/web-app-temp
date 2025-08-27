import admin from 'firebase-admin'
import { db } from '../../../drizzle/db/database.js'
import { BillingContainer } from '../../../features/billing/container.js'
import { UserContainer } from '../../../features/users/container.js'
import { ProjectContainer } from '../../../features/projects/container.js'
import { logger } from '../../utils/logger.js'

export interface AppConfig {
  googleCloudProjectId?: string
}

export class ServiceContainer {
  // Database
  public readonly db = db

  // Feature containers
  public readonly users: UserContainer
  public readonly billing: BillingContainer
  public readonly projects: ProjectContainer

  constructor(_config: AppConfig) {
    // Firebase Admin SDK の初期化 (まだ初期化されていない場合のみ)
    if (!admin.apps.length) {
      logger.info('Initializing Firebase Admin SDK...')
      admin.initializeApp()
      logger.info(`Firebase Admin SDK initialized. Apps count: ${admin.apps.length}`)
      // messaging が関数として存在するか確認
      if (typeof admin.messaging === 'function') {
        logger.info('admin.messaging() is available.')
      } else {
        logger.error('admin.messaging is NOT available or not a function after initializeApp.')
      }
    } else {
      logger.info('Firebase Admin SDK already initialized.')
    }

    // Initialize feature containers
    this.users = new UserContainer(db)
    this.billing = new BillingContainer(db)
    this.projects = new ProjectContainer(db)

    // 将来的な拡張例:
    // this.posts = new PostContainer(db);
    // this.notifications = new NotificationContainer(db);
    // this.files = new FileContainer(db);
  }
}
