import admin from 'firebase-admin'
import { AppConfig } from '../constants/config.js'
import { logger } from '../utils/logger.js'

/**
 * Firebase Admin SDKの初期化
 *
 * 環境に応じて適切な認証方式で初期化を行います：
 * 1. Cloud Run環境: Application Default Credentials (ADC)
 * 2. ローカル環境（認証ファイル）: GOOGLE_APPLICATION_CREDENTIALS
 * 3. 環境変数: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 * 4. デフォルト: 警告を出してデフォルト認証を試行
 */
export function initializeFirebaseAdmin(): void {
  // すでに初期化されている場合はスキップ
  if (admin.apps.length > 0) {
    logger.info('Firebase Admin SDK already initialized.')
    return
  }

  // Cloud Run環境の場合
  if (AppConfig.IS_CLOUD_RUN) {
    logger.info('Initializing Firebase Admin SDK with Application Default Credentials (Cloud Run)')
    admin.initializeApp({
      projectId: AppConfig.GCP_PROJECT_ID,
    })
    return
  }

  // ローカル環境で認証ファイルが指定されている場合
  if (AppConfig.GOOGLE_APPLICATION_CREDENTIALS) {
    logger.info('Initializing Firebase Admin SDK with GOOGLE_APPLICATION_CREDENTIALS')
    admin.initializeApp()
    return
  }

  // 環境変数から認証情報を取得
  if (AppConfig.hasFirebaseCredentials()) {
    logger.info('Initializing Firebase Admin SDK with environment credentials')
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: AppConfig.FIREBASE_PROJECT_ID!,
        clientEmail: AppConfig.FIREBASE_CLIENT_EMAIL!,
        privateKey: AppConfig.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      }),
    })
    return
  }

  // 認証情報が見つからない場合
  logger.warn('No Firebase credentials found, initializing with default credentials')
  admin.initializeApp()
}

// Firebase Admin SDK のエクスポート
export { admin }
