import { createFactory } from "hono/factory";
import { ServiceContainer } from "./container.js";
import { AppHTTPException } from "../../utils/error/index.js";

// Singleton instance
let serviceContainer: ServiceContainer;

// Factory for creating middleware
const factory = createFactory();

/**
 * ServiceContainerを初期化してコンテキストに設定するミドルウェア
 */
export const serviceContainerMiddleware = factory.createMiddleware(async (c, next) => {
  // 環境変数の検証
  const revenueCatSecretApiKey = process.env.REVENUECAT_SECRET_API_KEY;
  if (!revenueCatSecretApiKey) {
    throw new AppHTTPException(500, {
      message: "REVENUECAT_SECRET_API_KEY is not set",
    });
  }

  const googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!googlePlacesApiKey) {
    throw new AppHTTPException(500, {
      message: "GOOGLE_PLACES_API_KEY is not set",
    });
  }

  const googleCloudProjectId = process.env.GOOGLE_CLOUD_PROJECT_ID;

  // ServiceContainerの初期化（シングルトン）
  if (!serviceContainer) {
    serviceContainer = new ServiceContainer({
      revenueCatApiKey: revenueCatSecretApiKey,
      googlePlacesApiKey: googlePlacesApiKey,
      googleCloudProjectId: googleCloudProjectId,
    });
  }

  // コンテキストに設定
  c.set("services", serviceContainer);
  await next();
});