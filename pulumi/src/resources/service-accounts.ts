import * as gcp from '@pulumi/gcp'
import * as pulumi from '@pulumi/pulumi'
import { gcpConfig, naming } from '../config'

export interface ServiceAccounts {
  apiServiceAccount: gcp.serviceaccount.Account
  webServiceAccount: gcp.serviceaccount.Account
  stripeGatewayServiceAccount: gcp.serviceaccount.Account
}

/**
 * Create and configure service accounts for the application
 */
export function createServiceAccounts(): ServiceAccounts {
  // Get project number for Cloud Build service account
  const project = gcp.organizations.getProject({
    projectId: gcpConfig.project,
  })

  // API Service Account
  const apiServiceAccount = new gcp.serviceaccount.Account('api-sa', {
    accountId: naming.apiServiceAccountName,
    displayName: 'API Service Account',
    description: 'Service account for API Cloud Run service',
    project: gcpConfig.project,
  })

  // Grant Secret Manager access to API service account
  new gcp.projects.IAMMember('api-sa-secret-accessor', {
    project: gcpConfig.project,
    role: 'roles/secretmanager.secretAccessor',
    member: pulumi.interpolate`serviceAccount:${apiServiceAccount.email}`,
  })

  // Web Service Account
  const webServiceAccount = new gcp.serviceaccount.Account('web-sa', {
    accountId: naming.webServiceAccountName,
    displayName: 'Web Frontend Service Account',
    description: 'Service account for Web (Next.js) Cloud Run service',
    project: gcpConfig.project,
  })

  // Stripe Gateway Service Account (for API Gateway)
  const stripeGatewayServiceAccount = new gcp.serviceaccount.Account('stripe-gw-sa', {
    accountId: naming.stripeGatewayServiceAccountName,
    displayName: 'Stripe Webhook Gateway Service Account',
    description: 'Service account for API Gateway to forward Stripe webhooks',
    project: gcpConfig.project,
  })

  // Grant Cloud Build service account necessary permissions
  project.then((p) => {
    const cloudBuildServiceAccount = `${p.number}-compute@developer.gserviceaccount.com`

    // Grant Cloud Run Admin role
    new gcp.projects.IAMMember('cloudbuild-run-admin', {
      project: gcpConfig.project,
      role: 'roles/run.admin',
      member: `serviceAccount:${cloudBuildServiceAccount}`,
    })

    // Grant Service Account User role
    new gcp.projects.IAMMember('cloudbuild-sa-user', {
      project: gcpConfig.project,
      role: 'roles/iam.serviceAccountUser',
      member: `serviceAccount:${cloudBuildServiceAccount}`,
    })

    // Grant Secret Manager access (for reading secrets during build)
    new gcp.projects.IAMMember('cloudbuild-secret-accessor', {
      project: gcpConfig.project,
      role: 'roles/secretmanager.secretAccessor',
      member: `serviceAccount:${cloudBuildServiceAccount}`,
    })
  })

  return {
    apiServiceAccount,
    webServiceAccount,
    stripeGatewayServiceAccount,
  }
}

/**
 * Grant API invocation permission to a service account for a specific Cloud Run service
 * This should be called after the Cloud Run service is created
 */
export function grantCloudRunInvokePermission(
  serviceName: string,
  serviceAccount: gcp.serviceaccount.Account,
  cloudRunService: gcp.cloudrun.Service
) {
  return new gcp.cloudrun.ServiceIamMember(`${serviceName}-invoker`, {
    project: gcpConfig.project,
    location: gcpConfig.region,
    service: cloudRunService.name,
    role: 'roles/run.invoker',
    member: pulumi.interpolate`serviceAccount:${serviceAccount.email}`,
  })
}