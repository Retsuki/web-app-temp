import admin from "firebase-admin";

import { logger } from "../utils/logger.js";

export interface AppConfig {
  revenueCatApiKey: string;
  googlePlacesApiKey: string;
  googleCloudProjectId?: string;
}

export class UseCaseContainer {
  constructor(config: AppConfig) {
    // Firebase Admin SDK の初期化 (まだ初期化されていない場合のみ)
    if (!admin.apps.length) {
      logger.info("Initializing Firebase Admin SDK...");
      admin.initializeApp();
      logger.info(
        `Firebase Admin SDK initialized. Apps count: ${admin.apps.length}`
      );
      // messaging が関数として存在するか確認
      if (typeof admin.messaging === "function") {
        logger.info("admin.messaging() is available.");
      } else {
        logger.error(
          "admin.messaging is NOT available or not a function after initializeApp."
        );
      }
    } else {
      logger.info("Firebase Admin SDK already initialized.");
    }
  }
}
