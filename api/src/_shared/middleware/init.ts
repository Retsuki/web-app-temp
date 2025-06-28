import { createFactory } from "hono/factory";
import { ServiceContainer } from "../factory/service-container.js";
import { AppHTTPException } from "../utils/error/index.js";

const factory = createFactory();
let serviceContainer: ServiceContainer;

export const initMiddleware = factory.createMiddleware(async (c, next) => {
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

  if (!serviceContainer) {
    serviceContainer = new ServiceContainer({
      revenueCatApiKey: revenueCatSecretApiKey,
      googlePlacesApiKey: googlePlacesApiKey,
      googleCloudProjectId: googleCloudProjectId,
    });
  }

  c.set("services", serviceContainer);
  await next();
});
