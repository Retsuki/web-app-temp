import * as pulumi from '@pulumi/pulumi'
import type { Environment } from '../utils/env-loader'

// Pulumi config
const config = new pulumi.Config()

// Get environment from stack config
export const environment = config.get('environment') as Environment || 'dev'

// GCP project configuration
export const gcpConfig = {
  project: config.require('gcp:project'),
  region: config.get('gcp:region') || 'asia-northeast1',
  zone: config.get('gcp:zone') || 'asia-northeast1-a',
}

// Service naming configuration
export const naming = {
  // Service names based on environment
  apiServiceName: environment === 'prod' ? 'web-app-api' : `api-${environment}`,
  webServiceName: environment === 'prod' ? 'web-app-web' : `web-${environment}`,
  
  // Secret names
  apiSecretName: `api-env-${environment}`,
  webSecretName: `web-env-${environment}`,
  
  // Service account names
  apiServiceAccountName: 'api-sa',
  webServiceAccountName: 'web-sa',
  stripeGatewayServiceAccountName: 'web-app-stripe-gw-sa',
  
  // Artifact Registry
  artifactRegistryName: 'web-app-temp',
  
  // API Gateway
  apiGatewayName: 'stripe-webhook-gateway',
  apiGatewayConfigName: 'stripe-webhook-config',
}

// Cloud Run configuration
export const cloudRunConfig = {
  minInstances: environment === 'prod' ? 0 : 0,
  maxInstances: environment === 'prod' ? 10 : 5,
  memory: '512Mi',
  cpu: '1',
  concurrency: 80,
  timeout: 300,
}

// GitHub repository configuration for Cloud Build
export const githubConfig = {
  owner: config.get('github:owner') || 'YOUR_GITHUB_USERNAME',
  repo: config.get('github:repo') || 'web-app-temp',
  branch: environment === 'prod' ? 'main' : 'develop',
}

// Export all configuration
export const appConfig = {
  environment,
  gcp: gcpConfig,
  naming,
  cloudRun: cloudRunConfig,
  github: githubConfig,
}