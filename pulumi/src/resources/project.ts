import * as gcp from '@pulumi/gcp'
import { gcpConfig } from '../config'

/**
 * Enable required GCP APIs for the project
 */
export function enableAPIs() {
  const apis = [
    'run.googleapis.com', // Cloud Run
    'artifactregistry.googleapis.com', // Artifact Registry
    'cloudbuild.googleapis.com', // Cloud Build
    'secretmanager.googleapis.com', // Secret Manager
    'cloudresourcemanager.googleapis.com', // Resource Manager
    'apigateway.googleapis.com', // API Gateway
    'servicemanagement.googleapis.com', // Service Management (for API Gateway)
    'servicecontrol.googleapis.com', // Service Control (for API Gateway)
    'iam.googleapis.com', // IAM
  ]

  const enabledApis = apis.map(
    (api) =>
      new gcp.projects.Service(`enable-${api.replace('.googleapis.com', '')}`, {
        project: gcpConfig.project,
        service: api,
        disableOnDestroy: false,
      })
  )

  return enabledApis
}
