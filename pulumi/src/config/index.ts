import * as pulumi from '@pulumi/pulumi'
import type { Environment } from '../utils/env-loader'

// 設定の読み込み（名前空間ごとに分けて読み込む）
const config = new pulumi.Config()
const gcpProvider = new pulumi.Config('gcp')
const githubProvider = new pulumi.Config('github')

// 環境名（dev/stg/prod）
export const environment = (config.get('environment') as Environment) || 'dev'

// GCP設定
export const gcpConfig = {
  project: gcpProvider.require('project'),
  region: gcpProvider.get('region') || 'asia-northeast1',
  zone: gcpProvider.get('zone') || 'asia-northeast1-a',
}

// リソース名の定義
export const naming = {
  // サービス名（prod環境のみ環境名を付けない）
  apiServiceName: environment === 'prod' ? 'web-app-api' : `web-app-api-${environment}`,
  webServiceName: environment === 'prod' ? 'web-app-web' : `web-app-web-${environment}`,

  // シークレット名
  apiSecretName: `api-env-${environment}`,
  webSecretName: `web-env-${environment}`,

  // サービスアカウント名
  apiServiceAccountName: 'api-sa',
  webServiceAccountName: 'web-sa',
  stripeGatewayServiceAccountName: 'web-app-stripe-gw-sa',

  // Artifact Registry
  artifactRegistryName: 'web-app-temp',

  // API Gateway
  apiGatewayName: 'stripe-webhook-gateway',
  apiGatewayConfigName: 'stripe-webhook-config',
}

// Cloud Run設定
export const cloudRunConfig = {
  minInstances: environment === 'prod' ? 0 : 0,
  maxInstances: environment === 'prod' ? 10 : 5,
  memory: '512Mi',
  cpu: '1',
  concurrency: 80,
  timeout: 300,
}

// GitHub設定（Cloud Build用）
export const githubConfig = {
  owner: githubProvider.get('owner') || 'Retsuki',
  repo: githubProvider.get('repo') || 'web-app-temp',
  branch: environment === 'prod' ? 'main' : 'develop',
}

// 設定のエクスポート
export const appConfig = {
  environment,
  gcp: gcpConfig,
  naming,
  cloudRun: cloudRunConfig,
  github: githubConfig,
}
