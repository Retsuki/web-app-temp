import * as gcp from '@pulumi/gcp'
import * as pulumi from '@pulumi/pulumi'
import { environment, gcpConfig, naming } from '../config'
import { loadApiEnv, loadWebEnv, envToSecretData } from '../utils/env-loader'
import type { ServiceAccounts } from './service-accounts'

export interface Secrets {
  apiSecret: gcp.secretmanager.Secret
  webSecret: gcp.secretmanager.Secret
  apiSecretVersion: gcp.secretmanager.SecretVersion
  webSecretVersion: gcp.secretmanager.SecretVersion
}

/**
 * Create secrets in Google Secret Manager from environment files
 */
export function createSecrets(serviceAccounts: ServiceAccounts): Secrets {
  // Load environment variables from files
  const apiEnv = loadApiEnv(environment)
  const webEnv = loadWebEnv(environment)

  // Create API secret
  const apiSecret = new gcp.secretmanager.Secret('api-env-secret', {
    secretId: naming.apiSecretName,
    project: gcpConfig.project,
    replication: {
      auto: {},
    },
  })

  // Create API secret version with environment variables
  const apiSecretVersion = new gcp.secretmanager.SecretVersion('api-env-secret-version', {
    secret: apiSecret.id,
    secretData: envToSecretData(apiEnv),
  })

  // Grant API service account access to the secret
  new gcp.secretmanager.SecretIamMember('api-secret-iam', {
    project: gcpConfig.project,
    secretId: apiSecret.secretId,
    role: 'roles/secretmanager.secretAccessor',
    member: pulumi.interpolate`serviceAccount:${serviceAccounts.apiServiceAccount.email}`,
  })

  // Create Web secret
  const webSecret = new gcp.secretmanager.Secret('web-env-secret', {
    secretId: naming.webSecretName,
    project: gcpConfig.project,
    replication: {
      auto: {},
    },
  })

  // Create Web secret version with environment variables
  const webSecretVersion = new gcp.secretmanager.SecretVersion('web-env-secret-version', {
    secret: webSecret.id,
    secretData: envToSecretData(webEnv),
  })

  // Grant Web service account access to the secret (if needed for runtime)
  new gcp.secretmanager.SecretIamMember('web-secret-iam', {
    project: gcpConfig.project,
    secretId: webSecret.secretId,
    role: 'roles/secretmanager.secretAccessor',
    member: pulumi.interpolate`serviceAccount:${serviceAccounts.webServiceAccount.email}`,
  })

  // Grant Cloud Build access to secrets (for deployment)
  const project = gcp.organizations.getProject({
    projectId: gcpConfig.project,
  })

  project.then((p) => {
    const cloudBuildServiceAccount = `${p.number}-compute@developer.gserviceaccount.com`

    // Grant Cloud Build access to API secret
    new gcp.secretmanager.SecretIamMember('api-secret-cloudbuild-iam', {
      project: gcpConfig.project,
      secretId: apiSecret.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: `serviceAccount:${cloudBuildServiceAccount}`,
    })

    // Grant Cloud Build access to Web secret
    new gcp.secretmanager.SecretIamMember('web-secret-cloudbuild-iam', {
      project: gcpConfig.project,
      secretId: webSecret.secretId,
      role: 'roles/secretmanager.secretAccessor',
      member: `serviceAccount:${cloudBuildServiceAccount}`,
    })
  })

  return {
    apiSecret,
    webSecret,
    apiSecretVersion,
    webSecretVersion,
  }
}