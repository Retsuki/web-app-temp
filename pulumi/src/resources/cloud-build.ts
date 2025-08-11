import * as gcp from '@pulumi/gcp'
import { gcpConfig, naming, githubConfig } from '../config'

export interface CloudBuildTriggers {
  apiTrigger: gcp.cloudbuild.Trigger
  webTrigger: gcp.cloudbuild.Trigger
}

/**
 * Create Cloud Build triggers for GitHub repository
 */
export function createCloudBuildTriggers(): CloudBuildTriggers {
  // Note: GitHub connection needs to be set up manually in GCP Console first
  // These triggers will use the existing cloudbuild.yaml files in the repository

  // API Build Trigger
  const apiTrigger = new gcp.cloudbuild.Trigger('api-build-trigger', {
    name: `${naming.apiServiceName}-trigger`,
    project: gcpConfig.project,
    location: gcpConfig.region,
    
    github: {
      owner: githubConfig.owner,
      name: githubConfig.repo,
      push: {
        branch: githubConfig.branch,
      },
    },
    
    // Use existing cloudbuild.yaml
    filename: 'api/cloudbuild.yaml',
    
    // Only trigger when API files change
    includedFiles: [
      'api/**',
    ],
    
    substitutions: {
      _SERVICE_NAME: naming.apiServiceName,
      _REGION: gcpConfig.region,
    },
    
    description: `Build and deploy API service on ${githubConfig.branch} branch push`,
  })

  // Web Build Trigger
  const webTrigger = new gcp.cloudbuild.Trigger('web-build-trigger', {
    name: `${naming.webServiceName}-trigger`,
    project: gcpConfig.project,
    location: gcpConfig.region,
    
    github: {
      owner: githubConfig.owner,
      name: githubConfig.repo,
      push: {
        branch: githubConfig.branch,
      },
    },
    
    // Use existing cloudbuild.yaml
    filename: 'web/cloudbuild.yaml',
    
    // Only trigger when Web files change
    includedFiles: [
      'web/**',
    ],
    
    substitutions: {
      _SERVICE_NAME: naming.webServiceName,
      _REGION: gcpConfig.region,
    },
    
    description: `Build and deploy Web service on ${githubConfig.branch} branch push`,
  })

  return {
    apiTrigger,
    webTrigger,
  }
}