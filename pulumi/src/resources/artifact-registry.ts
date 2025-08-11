import * as gcp from '@pulumi/gcp'
import { gcpConfig, naming } from '../config'

export interface ArtifactRegistry {
  repository: gcp.artifactregistry.Repository
}

/**
 * Create Artifact Registry repository for Docker images
 */
export function createArtifactRegistry(): ArtifactRegistry {
  const repository = new gcp.artifactregistry.Repository('docker-repository', {
    repositoryId: naming.artifactRegistryName,
    project: gcpConfig.project,
    location: gcpConfig.region,
    format: 'DOCKER',
    description: 'Docker images for Web App Template',
  })

  return {
    repository,
  }
}